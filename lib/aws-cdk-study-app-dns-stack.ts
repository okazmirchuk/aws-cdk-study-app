import * as cdk from '@aws-cdk/core';
import {IPublicHostedZone, PublicHostedZone} from "@aws-cdk/aws-route53";
import {Certificate, CertificateValidation, ICertificate} from "@aws-cdk/aws-certificatemanager";

interface AwsCdkStudyAppDnsProps extends cdk.StackProps {
    dnsName: string
}

export class AwsCdkStudyAppDnsStack extends cdk.Stack {
    public readonly hostedZone: IPublicHostedZone;
    public readonly certificate: ICertificate;

    constructor(scope: cdk.Construct, id: string, props: AwsCdkStudyAppDnsProps) {
        super(scope, id, props);

        this.hostedZone = new PublicHostedZone(this, 'AwsCdkStudyAppHostedZone', {
            zoneName: props.dnsName
        })

        this.certificate = new Certificate(this, 'AwsCdkStudyAppCertificateManager', {
            domainName: props.dnsName,
            validation: CertificateValidation.fromDns(this.hostedZone)
        });
    }
}
