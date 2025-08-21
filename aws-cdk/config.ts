﻿import * as cdk from 'aws-cdk-lib';

import { ExportNames } from '../src/common/ts/cdk/export-names';
import configFile from './configuration.json';

export interface Config {
    alertEmail: string;
    loanApiToken: string;
    registerVideosFunctionName: string;
    videoRegisteredTopicArn: string;
}

const getValue = (key: keyof Config, prefix: string, exportSuffix: ExportNames): string => {
    return configFile[key] || cdk.Fn.importValue(prefix + exportSuffix);
}

export const getConfig = (prefix: string): Config => ({
    alertEmail: getValue('alertEmail', prefix, ExportNames.AlertEmail),
    loanApiToken: getValue('loanApiToken', prefix, ExportNames.LoanApiToken),
    registerVideosFunctionName: getValue('registerVideosFunctionName', prefix, ExportNames.RegisterVideosFunctionName),
    videoRegisteredTopicArn: getValue('videoRegisteredTopicArn', prefix, ExportNames.VideoRegisteredSnsTopicArn),
});