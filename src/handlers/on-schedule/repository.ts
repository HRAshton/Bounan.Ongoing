import { DeleteCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, getAnimeKey } from '../../shared/repository';
import { AnimeEntity, AnimeKey } from '../../models/anime-entity';
import { config } from '../../config/config';

export const getAll = async (): Promise<AnimeEntity[]> => {
    const command = new ScanCommand({
        TableName: config.database.tableName,
    });

    const response = await docClient.send(command);
    return response.Items as AnimeEntity[];
}

export const deleteAnime = async (animeKey: AnimeKey): Promise<void> => {
    const command = new DeleteCommand({
        TableName: config.database.tableName,
        Key: { AnimeKey: getAnimeKey(animeKey) },
        ConditionExpression: 'attribute_exists(AnimeKey)',
    });

    const result = await docClient.send(command);
    console.log('Deleted anime: ' + JSON.stringify(result));
}
