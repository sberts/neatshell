---
title: Using AWS CodeBuild to Deploy a Web Site
description: This post describes how to setup AWS Codebuild to deploy a basic web site.
date: 2024-08-09
tags:
  - Cloud
  - AWS
  - CodeBuild
  - S3
  - IAM
---
{% image "./codebuild.png", "AWS CodeBuild" %}

In this post I will describe how to use AWS CodeBuild to automatically deploy a web site to S3. I'll be using the resources I created in the previous post. I'm going to continue defining all my infrastructure using CloudFormation.

First, I'll create credentials to access GitHub. I'll place the credentials resource in it's own template. The token itself will need to be created on GitHub's web site. From account settings, go to developer settings. Create a new personal access token and select classic token. I will then store my new token in Secrets Manager in a secret named github where it can then be used by CloudFormation:

```
  CodeBuildSourceCredential:
    Type: AWS::CodeBuild::SourceCredential
    Properties:
      AuthType: PERSONAL_ACCESS_TOKEN
      ServerType: GITHUB
      Token: !Sub "{% raw %}{{{% endraw %}resolve:secretsmanager:${SecretName}:SecretString{% raw %}}}{% endraw %}"
```

Next, I'll define the IAM role for the CodeBuild Project. The rest of the resources will be defined in another template:

```
  CodeBuildRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Statement:
          - Effect: Allow
            Principal:
              Service: [codebuild.amazonaws.com]
            Action: ['sts:AssumeRole']
      Policies:
        - PolicyName: S3Policy
          PolicyDocument:
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                  - s3:ListBucket
                Resource:
                  - !Sub 'arn:aws:s3:::${S3Bucket}'
                  - !Sub 'arn:aws:s3:::${S3Bucket}/*'
        - PolicyName: CloudWatchPolicy
          PolicyDocument:
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource:
                  - !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/codebuild/${ProjectName}:*'
```

And finally, the CodeBuild project:

```
  CodeBuildProject:
    Type: AWS::CodeBuild::Project
    Properties:
      Name: !Ref ProjectName
      Source:
        Type: GITHUB
        Location: !Ref RepoURL
        BuildSpec: |
          version: 0.2
          phases:
            install:
              commands:
                - echo Installing dependencies...
                - npm install
            build:
              commands:
                - echo Building the project...
                - npm run build
                - aws s3 sync $OUTPUTFOLDER s3://$S3BUCKET
                - echo Build completed on `date`
      SourceVersion: !Ref BranchName
      Environment:
        Type: LINUX_CONTAINER
        Image: aws/codebuild/standard:7.0
        ComputeType: BUILD_GENERAL1_SMALL
        EnvironmentVariables:
          - Name: S3BUCKET
            Value: !Ref S3Bucket
          - Name: OUTPUTFOLDER
            Value: !Ref OutputFolder
      Artifacts:
        Type: NO_ARTIFACTS
      ServiceRole: !Ref CodeBuildRole
```

A GitHub Webhook is created which will run this codebuild job for any commits on the specified branch. The source credential template can be found <a href="/content/creds.yaml">here</a>. The CodeBuild project template can be found <a href="/content/codebuild.yaml">here</a>.