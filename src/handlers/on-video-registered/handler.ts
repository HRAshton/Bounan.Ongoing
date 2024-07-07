import { fromJson } from './models';
import { Context, SNSEvent } from 'aws-lambda';
import { process } from './processor';

const processMessage = async (message: string): Promise<void> => {
    console.log('Processing message: ', message);

    const updatingRequest = fromJson(message);
    await process(updatingRequest);

    console.log('Message processed');
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const handler = async (event: SNSEvent, context: Context): Promise<void> => {
    console.log('Processing event: ', JSON.stringify(event));
    for (const record of event.Records) {
        console.log('Processing record: ', record?.Sns?.MessageId);
        await processMessage(record.Sns.Message);
    }

    console.info('done');
};
