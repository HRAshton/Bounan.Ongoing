import { App as AwsApp } from 'aws-cdk-lib';
import { AniManCdkStack } from './stack';

class App extends AwsApp {
    constructor() {
        super();
        new AniManCdkStack(this, 'Bounan-Ongoing', {});
    }
}

new App().synth();
