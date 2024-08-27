---
title: Using GitHub Actions and Terraform with AWS
description: This post describes how to setup GitHub Actions and Terraform with AWS.
date: 2024-08-27
tags:
  - GitHub Actions
  - Terraform
  - AWS
  - CI/CD
  - IAM
---
{% image "./gh.png", "GitHub logo" %}

This post describes how to setup GitHub Actions and Terraform with AWS. Before you can use GitHub Actions with AWS, you will need to allow GitHub to access your account. This example uses Terraform to create an IAM role for GitHub Actions to use. This role has admin permissions for the services Terraform needs to configure. Make sure you update the variable allowed_repos_branches. This controls who can assume your IAM role.

```
resource "aws_iam_openid_connect_provider" "github_actions" {
    url = "https://token.actions.githubusercontent.com"
    client_id_list = [ "sts.amazonaws.com" ]
    thumbprint_list = [ data.tls_certificate.github.certificates[0].sha1_fingerprint ]
}

resource "aws_iam_role" "terraform" {
    name_prefix = "terraform"
    assume_role_policy = data.aws_iam_policy_document.assume_role.json
}

data "aws_iam_policy_document" "admin_permissions" {
    statement {
        effect = "Allow"
        actions = [ "ec2:*", "rds:*", "s3:*", "dynamodb:*", "kms:*", "iam:*", "secretsmanager:*" ]
        resources = [ "*" ]
    }
}

resource "aws_iam_role_policy" "admin" {
    role = aws_iam_role.terraform.id
    policy = data.aws_iam_policy_document.admin_permissions.json
}

data "tls_certificate" "github" {
    url = "https://token.actions.githubusercontent.com"
}

data "aws_iam_policy_document" "assume_role" {
    statement {
        actions = [ "sts:AssumeRoleWithWebIdentity" ]
        effect = "Allow"
        principals {
            identifiers = [ aws_iam_openid_connect_provider.github_actions.arn ]
            type = "Federated"
        }

        condition {
            test = "StringEquals"
            variable = "token.actions.githubusercontent.com:sub"
            values = [
                for a in var.allowed_repos_branches : "repo:${a["org"]}/${a["repo"]}:ref:refs/heads/${a["branch"]}"
            ]
        }
    }
}

variable "allowed_repos_branches" {
    description = "GitHub repos/branches allowed to assume the IAM role."
    type = list(object({
        org = string
        repo = string
        branch = string
    }))
    default = [
        {
            org = "your-github-username"
            repo = "your-repo-name"
            branch = "main"
        }
    ]
}
```

In your repo, create .github/workflows/terraform.yml. Update the IAM role in the workflow to use the role created above:

```
permissions:
  id-token: write
  contents: read
name: Terraform Apply
on:
  push:
    branches:
      - main
jobs:
  TerraformApply:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::111111111111:role/TerraformRole
          aws-region: us-west-2
      - name: Setup terraform
        uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: 1.1.7
          terraform_wrapper: false
      - name: Apply terraform
        run: |
          terraform init
          terraform apply -auto-approve
        working-directory: prod/services/web-service
```

Any Terraform configuration changes in the main branch of your repo should now be deployed automatically to your AWS account.
