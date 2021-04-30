import * as cdk from '@aws-cdk/core';
import {Bucket, BucketEncryption} from "@aws-cdk/aws-s3";
import {Runtime} from "@aws-cdk/aws-lambda"
import {join} from 'path';
import {NodejsFunction} from "@aws-cdk/aws-lambda-nodejs";
import {BucketDeployment, Source} from "@aws-cdk/aws-s3-deployment";
import {PolicyStatement} from "@aws-cdk/aws-iam";
import {CorsHttpMethod, HttpApi, HttpMethod} from "@aws-cdk/aws-apigatewayv2";
import {LambdaProxyIntegration} from "@aws-cdk/aws-apigatewayv2-integrations";
import {CloudFrontWebDistribution} from "@aws-cdk/aws-cloudfront";

interface AppStackProps extends cdk.StackProps {
    envName: string
}

export class AwsCdkStudyApp1Stack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props?: AppStackProps) {
        super(scope, id, props);

        const bucket = new Bucket(this, 'AwsCdkStudyAppBucket', {
            encryption: props?.envName === 'prod' ? BucketEncryption.S3_MANAGED : BucketEncryption.UNENCRYPTED
        })

        new BucketDeployment(this, 'AwsCdkStudyAppPhotos', {
            sources: [
                Source.asset(join(__dirname, '..', 'photos'))
            ],
            destinationBucket: bucket
        })

        const websiteBucket = new Bucket(this, 'AwsCdkSimpleWebsite', {
            websiteIndexDocument: 'index.html',
            publicReadAccess: true,
        })

        const getPhotos = new NodejsFunction(this, 'AwsCdkStudyLambda', {
            runtime: Runtime.NODEJS_12_X,
            entry: join(__dirname, '..', 'api', 'get-photos', 'index.ts'),
            handler: 'getPhotos',
            environment: {
                PHOTO_BUCKET_NAME: bucket.bucketName
            }
        })

        const bucketContainerPermissions = new PolicyStatement();

        bucketContainerPermissions.addResources(bucket.bucketArn)
        bucketContainerPermissions.addActions('s3:ListBucket');

        const bucketPermissions = new PolicyStatement()

        bucketPermissions.addResources(`${bucket.bucketArn}/*`)
        bucketPermissions.addActions('s3:GetObject', 's3:PutObject')

        getPhotos.addToRolePolicy(bucketPermissions);
        getPhotos.addToRolePolicy(bucketContainerPermissions);

        const httpApi = new HttpApi(this, 'CdkStudyAppHttpApi', {
            corsPreflight: {
                allowOrigins: ['*'],
                allowMethods: [CorsHttpMethod.GET],
            },
            apiName: 'photoApi',
            createDefaultStage: true,
        })

        const lambdaIntegration = new LambdaProxyIntegration({
            handler: getPhotos,
        })

        httpApi.addRoutes({
            path: '/getAllPhotos',
            methods: [
                HttpMethod.GET,
            ],
            integration: lambdaIntegration
        });

        const cloudFront = new CloudFrontWebDistribution(this, 'StudyAppDistribution', {
            originConfigs: [
                {
                    s3OriginSource: {
                        s3BucketSource: websiteBucket
                    },
                    behaviors: [{isDefaultBehavior: true}]
                }
            ]
        })

        new BucketDeployment(this, 'AwsCdkSimpleWebsiteDeploy', {
            sources: [Source.asset(join(__dirname, '..', 'frontend', 'build'))],
            destinationBucket: websiteBucket,
            distribution: cloudFront,
        })

        new cdk.CfnOutput(this, 'AwsCdkStudyAppBucketExport', {
            value: bucket.bucketName,
            exportName: `AwsCdkStudyAppBucketName-${props?.envName}`,
        })

        new cdk.CfnOutput(this, 'AwsCdkStudyAppWebsiteBucketExport', {
            value: websiteBucket.bucketName,
            exportName: `AwsCdkStudyAppWebsiteBucketName-${props?.envName}`,
        })

        new cdk.CfnOutput(this, 'AwsCdkStudyAppWebsiteUrl', {
            value: cloudFront.distributionDomainName,
            exportName: `AwsCdkStudyAppWebsiteUrl-${props?.envName}`,
        })

        new cdk.CfnOutput(this, 'CdkStudyApi', {
            value: httpApi.url!,
            exportName: `CdkStudyAppApiEndpoint-${props?.envName}`,
        })
    }
}
