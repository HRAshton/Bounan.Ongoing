import { Stack, StackProps, Duration, CfnOutput, RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subs from 'aws-cdk-lib/aws-sns-subscriptions';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cw from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import { LlrtFunction } from 'cdk-lambda-llrt';

import { config } from './config';

export class AniManCdkStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const table = this.createTable();

        const logGroup = this.createLogGroup();
        this.setErrorAlarm(logGroup);

        const functions = this.createLambdas(table, logGroup);

        // const videoRegisteredTopic = sns.Topic.fromTopicArn(
        //     this, 'VideoRegisteredSnsTopic', config.videoRegisteredTopicArn);
        // videoRegisteredTopic.addSubscription(
        //     new subs.LambdaSubscription(functions.get(LambdaHandler.OnVideoRegistered)!));

        this.out('Config', JSON.stringify(config));
        this.out('TableName', table.tableName);
        functions.forEach((func, key) => this.out(`${key}-LambdaName`, func.functionName));
    }

    private createTable(): dynamodb.Table {
        return new dynamodb.Table(this, 'Table', {
            partitionKey: { name: 'AnimeKey', type: dynamodb.AttributeType.STRING },
            removalPolicy: RemovalPolicy.RETAIN,
        });
    }

    private createLogGroup(): logs.LogGroup {
        return new logs.LogGroup(this, 'LogGroup', {
            retention: logs.RetentionDays.ONE_WEEK,
        });
    }

    private setErrorAlarm(logGroup: logs.LogGroup): void {
        const topic = new sns.Topic(this, 'LogGroupAlarmSnsTopic');
        topic.addSubscription(new subs.EmailSubscription(config.alertEmail));

        const metricFilter = logGroup.addMetricFilter('ErrorMetricFilter', {
            filterPattern: logs.FilterPattern.anyTerm('ERROR', 'Error', 'error', 'fail'),
            metricNamespace: this.stackName,
            metricName: 'ErrorCount',
            metricValue: '1',
        });

        const alarm = new cw.Alarm(this, 'LogGroupErrorAlarm', {
            metric: metricFilter.metric(),
            threshold: 1,
            evaluationPeriods: 1,
            treatMissingData: cw.TreatMissingData.NOT_BREACHING,
        });

        alarm.addAlarmAction(new cloudwatchActions.SnsAction(topic));
    }

    private createLambdas(filesTable: dynamodb.Table, logGroup: logs.LogGroup): Map<LambdaHandler, lambda.Function> {
        const functions = new Map<LambdaHandler, lambda.Function>();

        Object.entries(LambdaHandler).forEach(([lambdaName, handlerName]) => {
            const func = new LlrtFunction(this, lambdaName, {
                entry: `src/handlers/${handlerName}/handler.ts`,
                handler: 'handler',
                logGroup: logGroup,
                environment: {
                    LOAN_API_TOKEN: config.loanApiToken,
                    LOAN_API_MAX_CONCURRENT_REQUESTS: '2',
                    DATABASE_TABLE_NAME: filesTable.tableName,
                },
                timeout: Duration.seconds(30),
            });

            filesTable.grantReadWriteData(func);
            functions.set(handlerName, func);
        });

        return functions;
    }

    private out(key: string, value: object | string): void {
        const output = typeof value === 'string' ? value : JSON.stringify(value);
        new CfnOutput(this, key, { value: output });
    }
}

enum LambdaHandler {
    OnVideoRegistered = 'on-video-registered',
    // OnSchedule = 'on-schedule',
}
