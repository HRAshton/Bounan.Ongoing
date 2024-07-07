import { config } from '../../config/config';
import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';
import { RegisterVideosRequest, VideoKey } from '../../common/ts/interfaces';

const lambdaClient = new LambdaClient({});

export const sendRegisterVideosRequest = async (videoKeys: VideoKey[]): Promise<void> => {
    console.log('Sending register videos request: ', videoKeys);

    const request: RegisterVideosRequest = {
        Items: videoKeys.map(x => ({ VideoKey: x })),
    };

    const message = JSON.stringify(request);
    console.log('Sending request: ', message);

    const result = await lambdaClient.send(new InvokeCommand({
        FunctionName: config.animan.registerVideosLambdaName,
        Payload: message,
    }));
    console.log('Request sent: ', result);
}