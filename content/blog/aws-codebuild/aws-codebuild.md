---
title: Using AWS CodeBuild to Deploy a Web Site
description: This post describes how to setup AWS Codebuild to deploy a basic web site.
date: 2024-07-25
draft: true
tags:
  - Cloud
  - AWS
  - CodeBuild
  - S3
  - IAM
---
{% image "./codebuild.png", "AWS CodeBuild" %}

In this post I will describe how to use AWS CodeBuild to automatically deploy a web site to S3. I'll be using the resources I created in the previous post. I'm going to continue defining all my infrastructure using CloudFormation.

First, I'll create credentials to access GitHub. I'll place the credentials resource in it's own template. The token itself will need to be created on GitHub's web site and I will pass it to the template as a parameter.

```
  GitHubSourceCredentials:
    Type: AWS::CodeBuild::SourceCredential
    Properties:
      NoEcho: true
      AuthType: PERSONAL_ACCESS_TOKEN
      ServerType: GITHUB
      Token: !Ref GitHubToken
```

Next, I'll define the IAM role for the CodeBuild Project. The rest of the resources will be in another template:

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
        - PolicyName: CodeBuildPolicy
          PolicyDocument:
            Statement:
              - Effect: Allow
                Action: ['s3:*', 'logs:*', 'secretsmanager:GetSecretValue']
                Resource: '*'
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
      Environment:
        Type: LINUX_CONTAINER
        Image: aws/codebuild/standard:4.0
        ComputeType: BUILD_GENERAL1_SMALL
        EnvironmentVariables:
          - Name: S3_BUCKET
            Value: !Ref S3Bucket
      Artifacts:
        Type: NO_ARTIFACTS
      ServiceRole: !Ref CodeBuildRole
```

A GitHub Webhook is created which will run this codebuild job for any commits on the specified branch. The source credential template can be found <a href="/content/token.yaml">here</a>. The CodeBuild project template can be found <a href="/content/codebuild.yaml">here</a>.