import { AnimeEntity, AnimeKey } from '../models/anime-entity';
import { config } from '../config/config';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';

const dynamoDbClient = new DynamoDBClient();

export const docClient = DynamoDBDocumentClient.from(dynamoDbClient);

export const getAnimeKey = (animeKey: AnimeKey): string => {
    return `${animeKey.MyAnimeListId}#${animeKey.Dub}`;
}

export const getEpisodes = async (animeKey: AnimeKey): Promise<Pick<AnimeEntity, 'Episodes' | 'UpdatedAt'>> => {
    const command = new GetCommand({
        TableName: config.value.database.tableName,
        Key: { AnimeKey: getAnimeKey(animeKey) },
        AttributesToGet: ['Episodes', 'UpdatedAt'],
    });

    const response = await docClient.send(command);
    return response.Item as Pick<AnimeEntity, 'Episodes' | 'UpdatedAt'>;
}
