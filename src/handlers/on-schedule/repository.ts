import { ScanCommand } from '@aws-sdk/lib-dynamodb';
import { docClient } from '../../shared/repository';
import { AnimeEntity } from '../../models/anime-entity';
import { config } from '../../config/config';

export const getAll = async (): Promise<AnimeEntity[]> => {
    const command = new ScanCommand({
        TableName: config.database.tableName,
    });

    const response = await docClient.send(command);
    return response.Items as AnimeEntity[];
}
