---
title: Setup a web site on AWS using S3, CloudFront, and CodeBuild
date: 2024-04-30
---

In this post I will describe how to setup a static web site on AWS. This is the same process I use for this web site. The code for the web site is stored in a GitHub repo. Changes to the main branch will automatically get deployed. I will use a private S3 bucket to store web site files and an origin access identity to secure access which is the best practice in 2024. I assume a hosted zone for the domain name already exists in Route 53 and I will use it for CNAME records and ACM certificate validation. I will use CloudFormation to create all new resources.