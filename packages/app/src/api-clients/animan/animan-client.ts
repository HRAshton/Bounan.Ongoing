import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';

import { RegisterVideosRequest, VideoKey } from '../../../../../third-party/common/ts/interfaces';
import { config } from '../../config/config';

const lambdaClient = new LambdaClient({});

export const sendRegisterVideosRequest = async (videoKeys: VideoKey[]): Promise<void> => {
    console.log('Sending register videos request: ', videoKeys);

    const request: RegisterVideosRequest = {
        items: videoKeys.map(videoKey => ({ videoKey })),
    };

    const message = JSON.stringify(request);
    console.log('Sending request: ', message);

    const result = await lambdaClient.send(new InvokeCommand({
        FunctionName: config.value.animan.registerVideosLambdaName,
        Payload: message,
    }));
    console.log('Request sent: ', result);
}