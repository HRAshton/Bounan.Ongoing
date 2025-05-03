const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const useRateLimit = <TArgs, TResult>(callback: (_: TArgs) => TResult, delayBetweenCallsMs: number) => {
    let lastCallTime = 0;

    return async (args: TArgs): Promise<TResult> => {
        const currentTime = Date.now();
        const timeSinceLastCall = currentTime - lastCallTime;

        if (timeSinceLastCall < delayBetweenCallsMs) {
            await sleep(delayBetweenCallsMs - timeSinceLastCall);
        }

        const result = await callback(args);
        lastCallTime = Date.now();
        return result;
    };

}