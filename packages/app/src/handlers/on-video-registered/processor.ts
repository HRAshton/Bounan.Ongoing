import { VideoKey, VideoRegisteredNotification } from '../../../../../third-party/common/ts/interfaces';
import { AnimeKey } from '../../models/anime-entity';
import { getEpisodes } from '../../shared/repository';
import { addAnime, addEpisodes } from './repository';

const processAnime = async (videos: VideoKey[]): Promise<void> => {
    const animeKey: AnimeKey = videos[0];
    const episodes = new Set(videos.map(x => x.episode));
    console.log('Anime key and episodes: ', animeKey, episodes);

    const animeEntity = await getEpisodes(animeKey);
    console.log('Anime episodes: ', animeEntity);

    if (!animeEntity) {
        console.log('Anime not found. Adding: ', animeKey, episodes);
        await addAnime(animeKey, episodes);
        return;
    }

    const newEpisodes = new Set([...episodes].filter(x => !animeEntity.episodes.has(x)));
    if (newEpisodes.size === 0) {
        console.log('Nothing to add');
        return;
    }

    console.log('Anime found. Adding episodes: ', animeKey, newEpisodes);
    await addEpisodes(animeKey, newEpisodes);
}

export const process = async (updatingRequests: VideoRegisteredNotification): Promise<void> => {
    console.log('Processing videos: ', JSON.stringify(updatingRequests));
    if (!updatingRequests.items || updatingRequests.items.length === 0) {
        console.log('No animes to process');
        return;
    }

    const videoKeys = updatingRequests.items.map(x => x.videoKey);
    const uniqueAnimes = videoKeys
        .filter((value, index, self) =>
            self.findIndex(x => x.myAnimeListId === value.myAnimeListId && x.dub === value.dub) === index);
    console.log('Animes to process: ', uniqueAnimes);

    for (const anime of uniqueAnimes) {
        const videosToProcess = videoKeys.filter(x => x.myAnimeListId === anime.myAnimeListId && x.dub === anime.dub);
        console.log('Processing videos: ', JSON.stringify(videosToProcess));
        await processAnime(videosToProcess);
        console.log('Anime processed');
    }

    console.log('Animes processed');
}