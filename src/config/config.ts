import { fetchSsmValue } from '../common/ts/runtime/ssm-client';

interface AniManConfig {
    registerVideosLambdaName: string;
}

interface LoanApiConfig {
    token: string;
    maxConcurrentRequests: number;
}

interface DatabaseConfig {
    tableName: string;
}

interface ProcessingConfig {
    outdatedPeriodHours: number;
}

export interface Config {
    animan: AniManConfig;
    loanApiConfig: LoanApiConfig;
    database: DatabaseConfig;
    processing: ProcessingConfig;
}

let cachedConfig: Config | undefined;

export const initConfig = async (): Promise<void> => {
    cachedConfig = await fetchSsmValue('/bounan/ongoing/runtime-config') as Config;
}

export const config = {
    get value() {
        if (!cachedConfig) {
            throw new Error('Config not initialized');
        }

        return cachedConfig;
    },
}