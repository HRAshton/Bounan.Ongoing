﻿/* eslint @typescript-eslint/no-explicit-any: 0 */

import { handler as videoRegistered } from './handlers/on-video-registered/handler';
import { VideoRegisteredNotification } from './common/ts/interfaces';

const onRegistered = async (message: VideoRegisteredNotification) => {
    console.log('Processing message: ', message);

    await videoRegistered(
        // @ts-expect-error - we don't need to provide all the event properties
        { Records: [{ Sns: { Message: JSON.stringify(message) } }] },
        null as any);

    console.log('Message processed');
}

process.env.AWS_PROFILE = 'hra';

const main = async () => {
    const myAnimeListId = 60;
    const dub = 'AniLibria.TV';

    console.log('TEST: Episodes should be registered on the first run');
    await onRegistered({
        Items: [
            {
                VideoKey: {
                    MyAnimeListId: myAnimeListId,
                    Dub: dub,
                    Episode: 1,
                },
            },
            {
                VideoKey: {
                    MyAnimeListId: myAnimeListId,
                    Dub: dub,
                    Episode: 2,
                },
            },
            {
                VideoKey: {
                    MyAnimeListId: myAnimeListId,
                    Dub: dub,
                    Episode: 3,
                },
            },
        ],
    });
    console.warn('Expected: 3 episodes registered\n\n');

    console.log('TEST: Episodes should not be registered twice');
    await onRegistered({
        Items: [
            {
                VideoKey: {
                    MyAnimeListId: myAnimeListId,
                    Dub: dub,
                    Episode: 2,
                },
            },
        ],
    });
    console.warn('Expected: No episodes registered\n\n');

    console.log('TEST: Only new episodes should be registered');
    await onRegistered({
        Items: [
            {
                VideoKey: {
                    MyAnimeListId: myAnimeListId,
                    Dub: dub,
                    Episode: 2,
                },
            },
            {
                VideoKey: {
                    MyAnimeListId: myAnimeListId,
                    Dub: dub,
                    Episode: 3,
                },
            },
            {
                VideoKey: {
                    MyAnimeListId: myAnimeListId,
                    Dub: dub,
                    Episode: 4,
                },
            },
            {
                VideoKey: {
                    MyAnimeListId: myAnimeListId,
                    Dub: dub,
                    Episode: 5,
                },
            },
        ],
    });
    console.warn('Expected: 4&5 episodes registered\n\n');

    console.log('TEST: Different titles should be registered separately');
    await onRegistered({
        Items: [
            {
                VideoKey: {
                    MyAnimeListId: myAnimeListId + 1,
                    Dub: dub,
                    Episode: 1,
                },
            },
            {
                VideoKey: {
                    MyAnimeListId: myAnimeListId,
                    Dub: dub,
                    Episode: 2,
                },
            },
            {
                VideoKey: {
                    MyAnimeListId: myAnimeListId + 1,
                    Dub: dub,
                    Episode: 3,
                },
            },
        ],
    });
    console.warn('Expected: 2 episodes registered for 1st title, 1 episode for 2nd title\n\n');
}

main();