import { ShikiAnimeInfo } from './shiki-anime-info';

export const SHIKIMORI_BASE_URL = 'https://shikimori.one';

export const getAnimeInfo = async (myAnimeListId: number): Promise<ShikiAnimeInfo> => {
    await new Promise(resolve => setTimeout(resolve, 100)); // Avoid rate limiting

    const response = await fetch(
        `${SHIKIMORI_BASE_URL}/api/animes/${myAnimeListId}`,
        {
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Bounan.Ongoing',
            },
        });

    return await response.json();
}