// process.env.AWS_PROFILE = '';
// process.env.LOAN_API_TOKEN = '';
// process.env.LOAN_API_MAX_CONCURRENT_REQUESTS = '';
// process.env.DATABASE_TABLE_NAME = '';

interface LoanApiConfig {
    token: string;
    maxConcurrentRequests: number;
}

interface DatabaseConfig {
    tableName: string;
}

export interface Config {
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
    loanApiConfig: {
        token: getEnv('LOAN_API_TOKEN'),
        maxConcurrentRequests: parseInt(getEnv('LOAN_API_MAX_CONCURRENT_REQUESTS')),
    },
    database: {
        tableName: getEnv('DATABASE_TABLE_NAME'),
    },
}