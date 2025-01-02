import { EventBridgeEvent } from 'aws-lambda';
import { getAll } from './repository';
import { sendRegisterVideosRequest } from '../../api-clients/animan/animan-client';
import { AnimeEntity } from '../../models/anime-entity';
import { VideoKey } from '../../common/ts/interfaces';
import { getExistingVideos, setToken } from '../../loan-api/src/animan-loan-api-client';
import { config } from '../../config/config';
import { checkIfCompleted } from '../../shared/helpers/is-completed';
import { deleteAnime } from '../on-video-registered/repository';

setToken(config.loanApiConfig.token);

const getNewVideos = async (anime: AnimeEntity): Promise<VideoKey[]> => {
    const loanApiVideos = await getExistingVideos(anime.MyAnimeListId, anime.Dub);
    console.log('Loan API videos: ', JSON.stringify(loanApiVideos));

    const newVideos = loanApiVideos.filter(x => !anime.Episodes.has(x.episode));
    console.log('New videos: ', JSON.stringify(newVideos));

    return newVideos.map(x => ({
        MyAnimeListId: x.myAnimeListId,
        Dub: x.dub,
        Episode: x.episode,
    }));
}

const registerNewVideos = async (): Promise<void> => {
    const registeredAnimes = await getAll();
    console.log('Registered animes: ', JSON.stringify(registeredAnimes));

    const newVideos = [];
    for (const anime of registeredAnimes) {
        const videos = await getNewVideos(anime);
        newVideos.push(...videos);
    }
    console.log('New videos: ', JSON.stringify(newVideos));

    console.log('Videos to register: ', JSON.stringify(newVideos));
    if (newVideos.length === 0) {
        console.log('No videos to register');
        return;
    }

    await sendRegisterVideosRequest(newVideos);
};

const cleanupCompletedSeries = async (): Promise<void> => {
    const registeredAnimes = await getAll();

    for (const anime of registeredAnimes) {
        const isCompleted = await checkIfCompleted(anime.MyAnimeListId, new Date(anime.UpdatedAt), anime.Episodes);
        if (isCompleted) {
            await deleteAnime(anime);
            console.info(`Anime was deleted: ${anime.MyAnimeListId}`);
        }
    }
}

const process = async (): Promise<void> => {
    console.log('Processing videos');
    await registerNewVideos();

    console.log('Cleaning up completed series');
    await cleanupCompletedSeries();
}

export const handler = async (event: EventBridgeEvent<never, never>): Promise<void> => {
    console.log('Processing event: ', JSON.stringify(event));
    await process();
    console.info('done');
};
