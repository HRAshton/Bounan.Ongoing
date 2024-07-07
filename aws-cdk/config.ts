import configFile from './configuration.json';

interface Config {
    alertEmail: string;
    loanApiToken: string;
    registerVideosFunctionName: string;
    videoRegisteredTopicArn: string;
}

export const config: Config = configFile;

if (!config.alertEmail) {
    throw new Error('errorAlarmEmail is required');
}
if (!config.loanApiToken) {
    throw new Error('loanApiToken is required');
}
if (!config.registerVideosFunctionName) {
    throw new Error('registerVideoFunctionName is required');
}
if (!config.videoRegisteredTopicArn) {
    throw new Error('videoRegisteredTopicArn is required');
}