import { EventBridgeEvent } from 'aws-lambda';

import { sendRegisterVideosRequest } from '../../api-clients/animan/animan-client';
import { VideoKey } from '../../common/ts/interfaces';
import { config, initConfig } from '../../config/config';
import { getExistingVideos, setToken } from '../../loan-api/src/loan-api-client';
import { AnimeEntity } from '../../models/anime-entity';
import { checkIfCompleted } from '../../shared/helpers/is-completed';
import { deleteAnime, getAll } from './repository';

const getNewVideos = async (anime: AnimeEntity): Promise<VideoKey[]> => {
    const loanApiVideos = await getExistingVideos(anime.myAnimeListId, anime.dub);
    console.log('Loan API videos: ', JSON.stringify(loanApiVideos));

    const newVideos = loanApiVideos.filter(x => !anime.episodes.has(x.episode));
    console.log('New videos: ', JSON.stringify(newVideos));

    return newVideos;
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
        const isCompleted = await checkIfCompleted(anime.myAnimeListId, new Date(anime.updatedAt), anime.episodes);
        if (isCompleted) {
            await deleteAnime(anime);
            console.info(`Anime was deleted: ${anime.myAnimeListId}`);
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
    await initConfig();
    setToken(config.value.loanApiConfig.token);
    await process();
    console.info('done');
};
