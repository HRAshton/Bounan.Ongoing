import { expect, test, describe } from 'vitest'
import { useRateLimit } from './rate-limit';
import { getAnimeById } from 'jikan-api-lightweight-client/src/client';

describe('useRateLimit', () => {
    const enumerateTimestamps = (timestamps: number[]): void => {
        console.log('Timestamps:');
        console.log(`0: ${timestamps[0]}`);
        for (let i = 1; i < timestamps.length; i++) {
            console.log(`${i}: ${timestamps[i]} (+ ${timestamps[i] - timestamps[i - 1]} ms)`);
        }
    }

    describe('unit tests', () => {
        test('should call the callback immediately if within rate limit', async () => {
            const callTimestamps: number[] = [];

            const mockCallback = (timestamps: number[]): void => {
                timestamps.push(Date.now());
            }

            const startTime = Date.now();
            const rateLimitedCallback = useRateLimit(mockCallback, 1000);

            await rateLimitedCallback(callTimestamps);

            enumerateTimestamps(callTimestamps);

            expect(callTimestamps.length).to.equal(1);
            expect(callTimestamps[0]).closeTo(startTime, 50); // Allow a small margin for execution time
        });

        test('should delay calls to respect the rate limit', async () => {
            const callTimestamps: number[] = [];

            const mockCallback = (timestamps: number[]): void => {
                timestamps.push(Date.now());
            }

            const startTime = Date.now();
            const rateLimitedCallback = useRateLimit(mockCallback, 333);

            await rateLimitedCallback(callTimestamps);
            await rateLimitedCallback(callTimestamps);
            await rateLimitedCallback(callTimestamps);
            await rateLimitedCallback(callTimestamps);
            await rateLimitedCallback(callTimestamps);

            enumerateTimestamps(callTimestamps);

            expect(callTimestamps.length).to.equal(5);
            expect(callTimestamps[0]).closeTo(startTime, 50);
            expect(callTimestamps[1]).closeTo(callTimestamps[0] + 333, 50);
            expect(callTimestamps[2]).closeTo(callTimestamps[1] + 333, 50);
            expect(callTimestamps[3]).closeTo(callTimestamps[2] + 333, 50);
            expect(callTimestamps[4]).closeTo(callTimestamps[3] + 333, 50);
        });

        test('should handle multiple calls correctly', async () => {
            const callArgs: number[] = [];

            const mockCallback = (args: { allArgs: number[], currentArg: number }): void => {
                args.allArgs.push(args.currentArg);
            }

            const rateLimitedCallback = useRateLimit(mockCallback, 0);
            await rateLimitedCallback({ allArgs: callArgs, currentArg: 1 });
            await rateLimitedCallback({ allArgs: callArgs, currentArg: 2 });
            await rateLimitedCallback({ allArgs: callArgs, currentArg: 3 });
            await rateLimitedCallback({ allArgs: callArgs, currentArg: 4 });

            expect(callArgs.length).equal(4);
            expect(callArgs[0]).equal(1);
            expect(callArgs[1]).equal(2);
            expect(callArgs[2]).equal(3);
            expect(callArgs[3]).equal(4);
        });
    });

    describe('integration tests', () => {
        test('integration with jikan', async () => {
            const timestamps: number[] = [];
            const results: unknown[] = [];
            const rateLimitedCallback = useRateLimit(() => getAnimeById({ id: 801 }), 500);

            for (let i = 0; i < 5; i++) {
                timestamps.push(Date.now());
                const res = await rateLimitedCallback({});
                results.push(res);
            }

            enumerateTimestamps(timestamps);

            expect(results.length).equal(5);
            for (const res of results) {
                expect(res).toBeInstanceOf(Object);
                expect(res).toHaveProperty('data');
            }
        });
    });
});