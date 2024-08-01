---
title: Automate Deploying a Basic Web App
description: This post describes how to setup AWS Codebuild to deploy a basic web site.
date: 2024-07-25
draft: true
tags:
  - Cloud
  - AWS
  - CodeBuild
---

In this post I will describe how to automate deploying a basic web app with AWS CodeBuild. I'll be using the resources I created in the previous post. I'm going to be defining all my infrastructure using CloudFormation.

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

  CodeBuildProject:
    Type: AWS::CodeBuild::Project
    Properties:
      Name: deploy-sberts-blog
      Source:
        Type: GITHUB
        Location: !Ref RepoURL
        Auth:
          Type: OAUTH
          Resource: !Sub arn:aws:codebuild:${AWS::Region}:${AWS::AccountId}:token/github
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
