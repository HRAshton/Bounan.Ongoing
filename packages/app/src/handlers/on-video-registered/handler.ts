import { SNSEvent } from 'aws-lambda';

import { retry } from '../../../../../third-party/common/ts/runtime/retry';
import { initConfig } from '../../config/config';
import { process } from './processor';

const processMessage = async (message: string): Promise<void> => {
    console.log('Processing message: ', message);

    const updatingRequest = JSON.parse(message);
    await process(updatingRequest);

    console.log('Message processed');
};

export const handler = async (event: SNSEvent): Promise<void> => {
    console.log('Processing event: ', JSON.stringify(event));
    await initConfig();
    for (const record of event.Records) {
        console.log('Processing record: ', record?.Sns?.MessageId);
        await retry(async () => await processMessage(record.Sns.Message), 3, () => true);
    }

    console.info('done');
};
