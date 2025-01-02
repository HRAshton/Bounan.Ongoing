import { VideoKey, VideoRegisteredNotification } from '../../common/ts/interfaces';
import { getEpisodes } from '../../shared/repository';
import { addAnime, addEpisodes } from './repository';
import { AnimeKey } from '../../models/anime-entity';

const processAnime = async (videos: VideoKey[]): Promise<void> => {
    const animeKey: AnimeKey = videos[0];
    const episodes = new Set(videos.map(x => x.Episode));
    console.log('Anime key and episodes: ', animeKey, episodes);

    const animeEntity = await getEpisodes(animeKey);
    console.log('Anime episodes: ', animeEntity);

    if (!animeEntity) {
        console.log('Anime not found. Adding: ', animeKey, episodes);
        await addAnime(animeKey, episodes);
        return;
    }

    const newEpisodes = new Set([...episodes].filter(x => !animeEntity.Episodes.has(x)));
    if (newEpisodes.size === 0) {
        console.log('Nothing to add');
        return;
    }

    console.log('Anime found. Adding episodes: ', animeKey, newEpisodes);
    await addEpisodes(animeKey, newEpisodes);
}

export const process = async (updatingRequests: VideoRegisteredNotification): Promise<void> => {
    console.log('Processing videos: ', JSON.stringify(updatingRequests));
    if (!updatingRequests.Items || updatingRequests.Items.length === 0) {
        console.log('No animes to process');
        return;
    }

    const videoKeys = updatingRequests.Items.map(x => x.VideoKey);
    const uniqueAnimes = videoKeys
        .map(x => ({ MyAnimeListId: x.MyAnimeListId, Dub: x.Dub }))
        .filter((value, index, self) =>
            self.findIndex(x => x.MyAnimeListId === value.MyAnimeListId && x.Dub === value.Dub) === index);
    console.log('Animes to process: ', uniqueAnimes);

    for (const anime of uniqueAnimes) {
        const videosToProcess = videoKeys.filter(x => x.MyAnimeListId === anime.MyAnimeListId && x.Dub === anime.Dub);
        console.log('Processing videos: ', JSON.stringify(videosToProcess));
        await processAnime(videosToProcess);
        console.log('Anime processed');
    }

    console.log('Animes processed');
}