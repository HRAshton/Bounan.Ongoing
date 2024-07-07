export interface AnimeEntity {
    AnimeKey: string;
    MyAnimeListId: number;
    Dub: string;

    Episodes: Set<number>;

    CreatedAt: string;
    UpdatedAt: string;
}

export type AnimeKey = Pick<AnimeEntity, 'MyAnimeListId' | 'Dub'>;