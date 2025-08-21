﻿import { DeleteCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

import { config } from '../../config/config';
import { AnimeEntity, AnimeKey } from '../../models/anime-entity';
import { docClient, getAnimeKey } from '../../shared/repository';

export const getAll = async (): Promise<AnimeEntity[]> => {
    const command = new ScanCommand({
        TableName: config.value.database.tableName,
    });

    const response = await docClient.send(command);
    return response.Items as AnimeEntity[];
}

export const deleteAnime = async (animeKey: AnimeKey): Promise<void> => {
    const command = new DeleteCommand({
        TableName: config.value.database.tableName,
        Key: { animeKey: getAnimeKey(animeKey) },
        ConditionExpression: 'attribute_exists(animeKey)',
    });

    const result = await docClient.send(command);
    console.log('Deleted anime: ' + JSON.stringify(result));
}
