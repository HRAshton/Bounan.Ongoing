/* eslint-disable @typescript-eslint/no-explicit-any */

import { VideoRegisteredNotification } from '../../common/ts/interfaces';

export const fromJson = (jsonText: string): VideoRegisteredNotification => {
    const result = JSON.parse(jsonText) as Partial<VideoRegisteredNotification> | any;

    if (!result) {
        throw new Error('Invalid JSON: ' + JSON.stringify(result));
    }

    if (!Array.isArray(result.Items)) {
        throw new Error('Invalid Items: ' + JSON.stringify(result));
    }

    for (const item of result.Items) {
        if (!Number.isInteger(item.VideoKey.MyAnimeListId)) {
            throw new Error('Invalid MyAnimeListId: ' + JSON.stringify(item));
        }

        if (typeof item.VideoKey.Dub !== 'string' || item.VideoKey.Dub.length === 0) {
            throw new Error('Invalid Dub: ' + JSON.stringify(item));
        }

        if (!Number.isInteger(item.VideoKey.Episode)) {
            throw new Error('Invalid Episode: ' + JSON.stringify(item));
        }
    }

    return result;
}