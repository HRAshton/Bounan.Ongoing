import { ShikiAnimeInfo } from './shiki-anime-info';

export const SHIKIMORI_BASE_URL = 'https://shikimori.one';

export const getAnimeInfo = (myAnimeListId: number): Promise<ShikiAnimeInfo> => {
    return fetch(
        `${SHIKIMORI_BASE_URL}/api/animes/${myAnimeListId}`,
        {
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Bounan.Ongoing',
            },
        })
        .then(response => response.json());
}