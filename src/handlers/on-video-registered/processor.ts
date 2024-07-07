import { VideoKey, VideoRegisteredNotification } from '../../common/ts/interfaces';
import { getEpisodes } from '../../shared/repository';
import { addAnime, addEpisodes, deleteAnime } from './repository';
import { AnimeKey } from '../../models/anime-entity';
import { config } from '../../config/config';
import { getAnimeInfo } from '../../api-clients/shikimori/shikimori-client';

const checkIfCompleted = async (
    animeKey: AnimeKey,
    updatedAt: string | undefined,
    allEpisodes: Set<number>,
): Promise<boolean> => {
    if (updatedAt) {
        const outdatedDate = new Date(new Date().getTime() - config.processing.outdatedPeriodHours * 60 * 60 * 1000);
        const isOutdated = new Date(updatedAt) < outdatedDate;
        if (isOutdated) {
            console.log('Anime outdated: ', outdatedDate, updatedAt, isOutdated);
            return true;
        } else {
            console.log('Anime is up to date: ', outdatedDate, updatedAt, isOutdated);
        }
    } else {
        console.log('Outdated check skipped: ', updatedAt);
    }

    const allEpisodesPresent = Math.max(...allEpisodes) - Math.min(...allEpisodes) + 1 === allEpisodes.size;
    if (!allEpisodesPresent) {
        console.warn('Some episodes are missing: ', allEpisodes);
        return false;
    } else {
        console.log('All episodes are present: ', allEpisodes);
    }

    const animeInfo = await getAnimeInfo(animeKey.MyAnimeListId);
    console.log('Anime info: ', animeInfo);

    const expectedLastEpisode: number | undefined = animeInfo?.episodes;

    return !!expectedLastEpisode && expectedLastEpisode <= Math.max(...allEpisodes);
}

const processAnime = async (videos: VideoKey[]): Promise<void> => {
    const animeKey: AnimeKey = videos[0];
    const episodes = new Set(videos.map(x => x.Episode));
    console.log('Anime key and episodes: ', animeKey, episodes);

    const animeEntity = await getEpisodes(animeKey);
    console.log('Anime episodes: ', animeEntity);

    const allEpisodes = new Set([...animeEntity?.Episodes ?? [], ...episodes]);
    const isAnimeCompleted = await checkIfCompleted(animeKey, animeEntity?.UpdatedAt, allEpisodes);
    if (isAnimeCompleted) {
        console.log('Anime is completed: ', animeKey);
        if (animeEntity) {
            console.log('Deleting anime: ', animeKey);
            await deleteAnime(animeKey);
        }

        return;
    }

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