import { config } from '../../config/config';
import { getAnimeInfo } from '../../api-clients/shikimori/shikimori-client';

// Assumption: episodes can be started from any number, but they are always in order.
// Say, if episode 12 is released, then all existing previous episodes are released as well.
export const checkIfCompleted = async (
    myAnimeListId: number,
    lastUpdate: Date,
    allEpisodes: Set<number>,
): Promise<boolean> => {
    const outdatedDate = new Date(new Date().getTime() - config.value.processing.outdatedPeriodHours * 60 * 60 * 1000);
    const isOutdated = lastUpdate < outdatedDate;
    if (isOutdated) {
        console.log('Anime outdated: ', outdatedDate, lastUpdate, isOutdated);
        return true;
    }

    const animeInfo = await getAnimeInfo(myAnimeListId);
    console.log('Anime info: ', animeInfo);

    const expectedLastEpisode: number | undefined = animeInfo?.episodes;
    console.log('Expected last episode: ', expectedLastEpisode);
    if (!expectedLastEpisode) {
        // If an expected last episode is not defined, it is probably a movie or a single episode anime.
        // Anyway, it worth leaving it in the db for a while, as it can be a mistake.
        console.warn('Expected last episode is not defined.');
        return false;
    }

    const observedLastEpisode = Math.max(...allEpisodes);
    console.log('Observed last episode: ', observedLastEpisode);

    const result = expectedLastEpisode <= observedLastEpisode;
    console.log('Anime completed check result: ', result);

    return expectedLastEpisode <= Math.max(...allEpisodes);
}
