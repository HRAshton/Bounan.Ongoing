import { retry } from '../../common/ts/runtime/retry';
import { SNSEvent } from 'aws-lambda';
import { process } from './processor';
import { initConfig } from '../../config/config';

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
