import { Construct } from 'constructs';
import { LlrtFunction } from 'cdk-lambda-llrt';
import * as cfn from 'aws-cdk-lib';
import * as eventBridge from 'aws-cdk-lib/aws-events';
import * as eventBridgeTargets from 'aws-cdk-lib/aws-events-targets';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subs from 'aws-cdk-lib/aws-sns-subscriptions';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cw from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';

import { Config, getConfig } from './config';

export class OngoingCdkStack extends cfn.Stack {
    constructor(scope: Construct, id: string, props?: cfn.StackProps) {
        super(scope, id, props);

        const config = getConfig('bounan:');

        const table = this.createTable();
        const logGroup = this.createLogGroup();
        const functions = this.createLambdas(table, logGroup, config);
        this.setSchedule(functions.get(LambdaHandler.OnSchedule)!);
        this.setErrorAlarm(logGroup, config);

        const videoRegisteredTopic = sns.Topic.fromTopicArn(
            this, 'VideoRegisteredSnsTopic', config.videoRegisteredTopicArn);
        videoRegisteredTopic.addSubscription(
            new subs.LambdaSubscription(functions.get(LambdaHandler.OnVideoRegistered)!));

        const registerVideosLambda = lambda.Function.fromFunctionName(
            this, 'RegisterVideosLambda', config.registerVideosFunctionName);
        registerVideosLambda.grantInvoke(functions.get(LambdaHandler.OnSchedule)!);

        this.out('Config', JSON.stringify(config));
    }

    private createTable(): dynamodb.Table {
        return new dynamodb.Table(this, 'Table', {
            partitionKey: { name: 'AnimeKey', type: dynamodb.AttributeType.STRING },
            removalPolicy: cfn.RemovalPolicy.RETAIN,
            readCapacity: 1,
            writeCapacity: 1,
        });
    }

    private createLogGroup(): logs.LogGroup {
        return new logs.LogGroup(this, 'LogGroup', {
            retention: logs.RetentionDays.ONE_WEEK,
        });
    }

    private setErrorAlarm(logGroup: logs.LogGroup, config: Config): void {
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

    private createLambdas(
        filesTable: dynamodb.Table,
        logGroup: logs.LogGroup,
        config: Config,
    ): Map<LambdaHandler, lambda.Function> {
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
                    ANIMAN_REGISTER_VIDEOS_FUNCTION_NAME: config.registerVideosFunctionName,
                    PROCESSING_OUTDATED_PERIOD_HOURS: '720',
                },
                timeout: cfn.Duration.seconds(30),
            });

            filesTable.grantReadWriteData(func);
            functions.set(handlerName, func);
        });

        return functions;
    }

    private setSchedule(registerVideosLambda: lambda.Function): void {
        new eventBridge.Rule(this, 'ScheduleRule', {
            schedule: eventBridge.Schedule.rate(cfn.Duration.hours(3)),
            targets: [new eventBridgeTargets.LambdaFunction(registerVideosLambda)],
        });
    }

    private out(key: string, value: object | string): void {
        const output = typeof value === 'string' ? value : JSON.stringify(value);
        new cfn.CfnOutput(this, key, { value: output });
    }
}

enum LambdaHandler {
    OnVideoRegistered = 'on-video-registered',
    OnSchedule = 'on-schedule',
}
