﻿import { PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, getAnimeKey } from '../../shared/repository';
import { AnimeEntity, AnimeKey } from '../../models/anime-entity';
import { config } from '../../config/config';

export const addAnime = async (animeKey: AnimeKey, episodes: Set<number>): Promise<void> => {
    const command = new PutCommand({
        TableName: config.value.database.tableName,
        Item: {
            animeKey: getAnimeKey(animeKey),
            myAnimeListId: animeKey.myAnimeListId,
            dub: animeKey.dub,
            episodes: episodes,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        } as AnimeEntity,
        ConditionExpression: 'attribute_not_exists(AnimeKey)',
    });

    const result = await docClient.send(command);
    console.log('Added anime: ' + JSON.stringify(result));
}

export const addEpisodes = async (animeKey: AnimeKey, episodes: Set<number>): Promise<void> => {
    const command = new UpdateCommand({
        TableName: config.value.database.tableName,
        Key: { animeKey: getAnimeKey(animeKey) },
        UpdateExpression: 'ADD episodes :episodes SET updatedAt = :updatedAt',
        ExpressionAttributeValues: {
            ':episodes': episodes,
            ':updatedAt': new Date().toISOString(),
        },
        ReturnValues: 'NONE',
        ConditionExpression: 'attribute_exists(animeKey)',
    });

    const result = await docClient.send(command);
    console.log('Added episodes: ' + JSON.stringify(result));
}
