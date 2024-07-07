// process.env.AWS_PROFILE = '';
// process.env.LOAN_API_TOKEN = '';
// process.env.LOAN_API_MAX_CONCURRENT_REQUESTS = '';
// process.env.DATABASE_TABLE_NAME = '';
// process.env.ANIMAN_REGISTER_VIDEOS_FUNCTION_NAME = ';

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

export interface Config {
    animan: AniManConfig;
    loanApiConfig: LoanApiConfig;
    database: DatabaseConfig;
}

const getEnv = (key: string): string => {
    const value = process.env[key];

    if (!value) {
        throw new Error(`Missing environment variable: ${key}`);
    }

    return value;
}

export const config: Config = {
    animan: {
        registerVideosLambdaName: getEnv('ANIMAN_REGISTER_VIDEOS_FUNCTION_NAME'),
    },
    loanApiConfig: {
        token: getEnv('LOAN_API_TOKEN'),
        maxConcurrentRequests: parseInt(getEnv('LOAN_API_MAX_CONCURRENT_REQUESTS')),
    },
    database: {
        tableName: getEnv('DATABASE_TABLE_NAME'),
    },
}