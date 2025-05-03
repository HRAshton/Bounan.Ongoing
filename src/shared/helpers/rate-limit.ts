const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const useRateLimit = <TArgs, TResult>(callback: (_: TArgs) => TResult, callsPerSecond: number) => {
    const delay = 1000 / callsPerSecond;
    let lastCallTime = 0;

    return async (args: TArgs): Promise<TResult> => {
        const currentTime = Date.now();
        const timeSinceLastCall = currentTime - lastCallTime;

        if (timeSinceLastCall < delay) {
            await sleep(delay - timeSinceLastCall);
        }

        lastCallTime = Date.now();
        return callback(args);
    };
}