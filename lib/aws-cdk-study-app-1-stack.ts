import * as cdk from '@aws-cdk/core';
import {Bucket, BucketEncryption} from "@aws-cdk/aws-s3";
import {Runtime} from "@aws-cdk/aws-lambda"
import {join} from 'path';
import {NodejsFunction} from "@aws-cdk/aws-lambda-nodejs";
import {getPhotos} from "../api/get-photos";
import {BucketDeployment, Source} from "@aws-cdk/aws-s3-deployment";

export class AwsCdkStudyApp1Stack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucket = new Bucket(this, 'AwsCdkStudyAppBucket', {
      encryption: BucketEncryption.S3_MANAGED,
    })

    new cdk.CfnOutput(this, 'AwsCdkStudyAppBucketExport', {
      value: bucket.bucketName
    })

    new BucketDeployment(this, 'AwsCdkStudyAppPhotos', {
      sources: [
        Source.asset(join(__dirname, '..', 'photos'))
      ],
      destinationBucket: bucket
    })

    const getPhotos = new NodejsFunction(this, 'AwsCdkStudyLambda', {
      runtime: Runtime.NODEJS_12_X,
      entry: join(__dirname, '..', 'api', 'get-photos', 'index.ts'),
      handler: 'getPhotos',
      environment: {
        PHOTO_BUCKET_NAME: bucket.bucketName
      }
    })

  }
}
