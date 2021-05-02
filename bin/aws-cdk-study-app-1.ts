#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { AwsCdkStudyAppStack } from '../lib/aws-cdk-study-app-stack';
import {AwsCdkStudyAppDnsStack} from "../lib/aws-cdk-study-app-dns-stack";

const app = new cdk.App();
const domainNameApex = 'raccoon-lab.com'

const { hostedZone, certificate } = new AwsCdkStudyAppDnsStack(app, 'AwsCdkStudyAppDnsStack', {
    dnsName: domainNameApex,
    env: {
        region: 'us-east-1'
    }
});

new AwsCdkStudyAppStack(app, 'AwsCdkStudyAppStack', {
    hostedZone,
    certificate,
    dnsName: domainNameApex,
    env: {
        region: 'us-east-1'
    }
});
