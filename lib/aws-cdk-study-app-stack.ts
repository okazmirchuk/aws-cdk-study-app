import * as cdk from '@aws-cdk/core';
import {Bucket, BucketEncryption} from "@aws-cdk/aws-s3";
import {Runtime} from "@aws-cdk/aws-lambda"
import {join} from 'path';
import {NodejsFunction} from "@aws-cdk/aws-lambda-nodejs";
import {BucketDeployment, Source} from "@aws-cdk/aws-s3-deployment";
import {PolicyStatement} from "@aws-cdk/aws-iam";
import {CorsHttpMethod, HttpApi, HttpMethod} from "@aws-cdk/aws-apigatewayv2";
import {LambdaProxyIntegration} from "@aws-cdk/aws-apigatewayv2-integrations";
import {Distribution} from "@aws-cdk/aws-cloudfront";
import {ARecord, IPublicHostedZone, RecordTarget} from "@aws-cdk/aws-route53";
import {ICertificate} from "@aws-cdk/aws-certificatemanager";
import {S3Origin} from "@aws-cdk/aws-cloudfront-origins";
import {CloudFrontTarget} from "@aws-cdk/aws-route53-targets";
import {S3BucketWithDeploy} from "./s3-bucket-with-deploy";

interface AppStackProps extends cdk.StackProps {
    hostedZone: IPublicHostedZone;
    certificate: ICertificate;
    dnsName: string
}

export class AwsCdkStudyAppStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props: AppStackProps) {
        super(scope, id, props);

        const { bucket } = new S3BucketWithDeploy(this, 'AwsCdkStudyAppBucket', {
            deployTo: ['..', 'photos']
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

        const cloudFront = new Distribution(this, 'StudyAppDistribution', {
            defaultBehavior: {origin: new S3Origin(websiteBucket)},
            domainNames: [props.dnsName],
            certificate: props.certificate,
        })

        new ARecord(this, 'AwsCdkStudyAppApex', {
            zone: props.hostedZone,
            target: RecordTarget.fromAlias(new CloudFrontTarget(cloudFront))
        })

        new BucketDeployment(this, 'AwsCdkSimpleWebsiteDeploy', {
            sources: [Source.asset(join(__dirname, '..', 'frontend', 'build'))],
            destinationBucket: websiteBucket,
            distribution: cloudFront,
        })

        new cdk.CfnOutput(this, 'AwsCdkStudyAppBucketExport', {
            value: bucket.bucketName,
            exportName: `AwsCdkStudyAppBucketName`,
        })

        new cdk.CfnOutput(this, 'AwsCdkStudyAppWebsiteBucketExport', {
            value: websiteBucket.bucketName,
            exportName: `AwsCdkStudyAppWebsiteBucketName`,
        })

        new cdk.CfnOutput(this, 'AwsCdkStudyAppWebsiteUrl', {
            value: cloudFront.distributionDomainName,
            exportName: `AwsCdkStudyAppWebsiteUrl`,
        })

        new cdk.CfnOutput(this, 'CdkStudyApi', {
            value: httpApi.url!,
            exportName: `CdkStudyAppApiEndpoint`,
        })
    }
}
