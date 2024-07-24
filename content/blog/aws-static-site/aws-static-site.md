---
title: Static Web Site Hosting on AWS
description: This post describes how to setup AWS to host a static web site.
date: 2024-07-23
---

In this post I will describe how to setup a static web site on AWS with S3 and CloudFront. I'll be defining all infrastructure in CloudFormation. I'm going to use an existing SSL certificate that already exists in ACM and reference it using a parameter.

```
AWSTemplateFormatVersion: '2010-09-09'
Description: Static Web Site

Parameters:
  ServerName:
    Type: String
    Description: Server name

  CertificateId:
    Type: String
    Description: The ID of the existing ACM certificate
    Default: enter-id-here
```

I will use a private S3 bucket to store web site files and an origin access identity to secure access.

```
  S3BucketMain:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: unique-bucket-name
      AccessControl: Private

  BucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref S3BucketMain
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: "cloudfront.amazonaws.com"
            Action: 's3:GetObject'
            Resource: !Sub arn:aws:s3:::${S3BucketMain}/*
            Condition:
              StringEquals:
                AWS:SourceArn: !Sub
                  - arn:aws:cloudfront::${AWS::AccountId}:distribution/${DistId}
                  - DistId: !GetAtt CloudFrontDistribution.Id
```

I use CloudFront to serve content from S3. I'm creating a CloudFrontOriginAccessIdentity to allow CloudFront to access my S3 bucket.

```
  CloudFrontOriginAccessControl:
    Type: AWS::CloudFront::OriginAccessControl
    Properties:
      OriginAccessControlConfig:
        Description: "origin access control(OAC) for allowing cloudfront to access S3 bucket"
        Name: static-site-OAC
        OriginAccessControlOriginType: s3
        SigningBehavior: always
        SigningProtocol: sigv4

  CloudFrontOriginIdentity:
    Type: AWS::CloudFront::CloudFrontOriginAccessIdentity
    Properties:
      CloudFrontOriginAccessIdentityConfig:
        Comment: "origin identity"

  CloudFrontDistribution:
    Type: AWS::CloudFront::Distribution
    DependsOn:
      - S3BucketMain
    Properties:
      DistributionConfig:
        Origins:
          - DomainName: !Sub ${S3BucketMain}.s3.us-west-2.amazonaws.com
            Id: static-hosting
            S3OriginConfig:
              OriginAccessIdentity: ""
            OriginAccessControlId: !GetAtt CloudFrontOriginAccessControl.Id
        Enabled: "true"
        DefaultRootObject: index.html
        CustomErrorResponses:
          - ErrorCode: 404
            ResponseCode: 200
            ResponsePagePath: /index.html
          - ErrorCode: 403
            ResponseCode: 200
            ResponsePagePath: /index.html
        HttpVersion: http2
        Aliases:
          - !Ref ServerName
        ViewerCertificate:
          AcmCertificateArn: !Sub arn:aws:acm:us-east-1:${AWS::AccountId}:certificate/${CertificateId}
          MinimumProtocolVersion: TLSv1.2_2021
          SslSupportMethod: sni-only
        DefaultCacheBehavior:
          AllowedMethods:
            - DELETE
            - GET
            - HEAD
            - OPTIONS
            - PATCH
            - POST
            - PUT
          Compress: true
          TargetOriginId: static-hosting
          ForwardedValues:
            QueryString: "false"
            Cookies:
              Forward: none
          ViewerProtocolPolicy: redirect-to-https

```

I'm using a CloudFront function to help serve web requests.

```
  DistributionFunction:
    Type: AWS::CloudFront::Function
    Properties:
      AutoPublish: true
      FunctionCode: |
        function handler(event) {
          var request = event.request;
          var uri = request.uri;
          
          // Check whether the URI is missing a file name.
          if (uri.endsWith('/')) {
              request.uri += 'index.html';
          } 
          // Check whether the URI is missing a file extension.
          else if (!uri.includes('.')) {
              request.uri += '/index.html';
          }

          return request;
        }
      FunctionConfig:
        Comment: Redirect-Default-Index-Request
        Runtime: cloudfront-js-1.0
      Name: test-site-site-redirect-index-request
```

I include the CloudFront distribution domain name in the output.

```
Outputs:

  CloudFrontURLMain:
    Value: !GetAtt [CloudFrontDistribution, DomainName]
    Description: URL of the CloudFront distribution for the main environment

```

In the next post I'll configure automatic deployment.
