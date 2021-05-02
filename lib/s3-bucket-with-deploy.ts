import * as cdk from '@aws-cdk/core';
import {Bucket, BucketEncryption, IBucket} from "@aws-cdk/aws-s3";
import {BucketDeployment, Source} from "@aws-cdk/aws-s3-deployment";
import {join} from "path";

interface S3BucketWithDeployProps {
   deployTo: string[]
}

export class S3BucketWithDeploy extends  cdk.Construct {
    public readonly bucket: IBucket;

    constructor(scope: cdk.Construct, id: string, props: S3BucketWithDeployProps) {
        super(scope, id);

        this.bucket = new Bucket(this, 'AwsCdkStudyAppBucket', {
            encryption: BucketEncryption.S3_MANAGED
        })

        new BucketDeployment(this, 'AwsCdkStudyAppPhotos', {
            sources: [
                Source.asset(join(__dirname, ...props.deployTo))
            ],
            destinationBucket: this.bucket
        })
    }
}
