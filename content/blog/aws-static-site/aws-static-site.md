---
title: Static Web Site Hosting on AWS
description: This post describes how to setup AWS to host a static web site.
date: 2024-07-23
tags:
  - Cloud
  - AWS
  - CloudFormation
---

In this post I will describe how to setup a static web site on AWS with S3 and CloudFront. I'll be defining all infrastructure in CloudFormation. First, I'll define a SSL certificate that I can use with CloudFront.

```
  Certificate:
    Type: AWS::CertificateManager::Certificate
    Properties:
      DomainName: !Ref Hostname
      ValidationMethod: DNS
      DomainValidationOptions:
        - DomainName: !Ref Hostname
          HostedZoneId: !Ref HostedZoneId
        - DomainName: !Sub www.${Hostname}
          HostedZoneId: !Ref HostedZoneId
      SubjectAlternativeNames:
        - !Sub www.${Hostname}
```

Next, I'll define a S3 bucket to store web site files and an origin access identity to secure access.

```
  S3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Ref BucketName
      AccessControl: Private

  BucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref S3Bucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: "cloudfront.amazonaws.com"
            Action: 's3:GetObject'
            Resource: !Sub arn:aws:s3:::${S3Bucket}/*
            Condition:
              StringEquals:
                AWS:SourceArn: !Sub
                  - arn:aws:cloudfront::${AWS::AccountId}:distribution/${DistId}
                  - DistId: !GetAtt CloudFrontDistribution.Id
```

Then, I use CloudFront to serve content from S3. I'm defining a CloudFrontOriginAccessIdentity to allow CloudFront to access my S3 bucket and my CloudFront distribution.

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
          - DomainName: !Sub ${S3Bucket}.s3.us-west-2.amazonaws.com
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
          AcmCertificateArn: !Ref Certificate
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

I'm using a CloudFront function to help serve web requests that I found here <a href="https://stackoverflow.com/questions/59634922/how-do-i-serve-index-html-in-subfolders-with-s3-cloudfront">https://stackoverflow.com/questions/59634922/how-do-i-serve-index-html-in-subfolders-with-s3-cloudfront</a>

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
      Name: redirect-index-request
```

The full template can be found <a href="/content/template.yaml">here</a>. Once the template has been deployed, I can copy my web site files into the new S3 bucket and I should have a functioning web site. In the next post I'll describe how to create basic automation for deploying a web app.
