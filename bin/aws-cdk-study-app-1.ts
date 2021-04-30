#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { AwsCdkStudyApp1Stack } from '../lib/aws-cdk-study-app-1-stack';

const app = new cdk.App();

new AwsCdkStudyApp1Stack(app, 'AwsCdkStudyApp1Stack-dev', {
    env: {
        region: 'us-east-2',
    },
    envName: 'dev'
});
new AwsCdkStudyApp1Stack(app, 'AwsCdkStudyApp1Stack-prod', {
    env: {
        region: 'us-west-1'
    },
    envName: 'prod'
});
