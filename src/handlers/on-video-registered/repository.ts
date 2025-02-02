import { PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, getAnimeKey } from '../../shared/repository';
import { AnimeKey } from '../../models/anime-entity';
import { config } from '../../config/config';

export const addAnime = async (animeKey: AnimeKey, episodes: Set<number>): Promise<void> => {
    const command = new PutCommand({
        TableName: config.value.database.tableName,
        Item: {
            AnimeKey: getAnimeKey(animeKey),
            MyAnimeListId: animeKey.MyAnimeListId,
            Dub: animeKey.Dub,
            Episodes: episodes,
            CreatedAt: new Date().toISOString(),
            UpdatedAt: new Date().toISOString(),
        },
        ConditionExpression: 'attribute_not_exists(AnimeKey)',
    });

    const result = await docClient.send(command);
    console.log('Added anime: ' + JSON.stringify(result));
}

export const addEpisodes = async (animeKey: AnimeKey, episodes: Set<number>): Promise<void> => {
    const command = new UpdateCommand({
        TableName: config.value.database.tableName,
        Key: { AnimeKey: getAnimeKey(animeKey) },
        UpdateExpression: 'ADD Episodes :episodes SET UpdatedAt = :updatedAt',
        ExpressionAttributeValues: {
            ':episodes': episodes,
            ':updatedAt': new Date().toISOString(),
        },
        ReturnValues: 'NONE',
        ConditionExpression: 'attribute_exists(AnimeKey)',
    });

    const result = await docClient.send(command);
    console.log('Added episodes: ' + JSON.stringify(result));
}
