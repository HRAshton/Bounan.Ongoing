import { App as AwsApp } from 'aws-cdk-lib';
import { OngoingCdkStack } from './stack';

class App extends AwsApp {
    constructor() {
        super();
        new OngoingCdkStack(this, 'Bounan-Ongoing', {});
    }
}

new App().synth();
