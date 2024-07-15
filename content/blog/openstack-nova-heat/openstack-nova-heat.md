---
title: OpenStack Nova and Heat
date: 2015-01-26
draft: false
tags:
- OpenStack
- Heat
- Nova
- CloudFormation
---

{% image "./openstack.png", "Openstack logo" %}
<p>OpenStack is an open source cloud platform. Its available for public and private clouds. This post describes to how to create new instances and other resources using nova and heat. To begin you will first need to install some software.</p>

<p>Run this command to install the <a href="http://www.openstack.org">OpenStack</a> client software (on CentOS Linux):</p>

<pre>
yum install -y python-keystoneclient python-novaclient python-neutronclient \
  python-glanceclient python-cinderclient python-heatclient
</pre>

<p>Setup environment variables:</p>

<pre>
export OS_TENANT_NAME=projectname
export OS_USERNAME=myusername
export OS_PASSWORD=mypassword
export OS_AUTH_URL=http://controller:5000/v2.0
export OS_REGION_NAME=regionOne
</pre>

<p>Substitute in your credentials and save these to a file to make them easier to load.</p>

<p>If you are using neutron networking you may need to run some additional commands:</p>

<pre>
neutron net-create myprojectnet
neutron subnet-create myproject-net 172.16.0.0/24 --name myprojectsubnet \
  --gateway 172.16.0.1

neutron router-create myprojectrouter
neutron router-interface-add myprojectrouter myprojectsubnet
neutron router-gateway-set myprojectrouter ext-net
</pre>

For more information, check out the <a href="http://docs.openstack.org">OpenStack Documentation</a>.

<h4>OpenStack Nova</h4>

Before creating a new instance, you will need to add a SSH key to OpenStack for your new instance to use.

<pre>
ssh-keygen
nova keypair-add --pub-key ~/.ssh/id_rsa.pub mykey
</pre>

Create new instance

<pre>
myprojectnetid=$(neutron subnet-list | grep myprojectsubnet | awk '{print $2}')
nova boot --flavor m1.tiny --image cirros --nic net-id=$myprojectnetid \
  --security-group default --key-name mykey myinstance1
</pre>

<h4>OpenStack Heat</h4>

Heat creates new resources and groups them into stacks. Here is a sample <a href="http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-template-resource-type-ref.html">CloudFormation</a> template that can be used with heat. It creates a new instance, security group, and external IP.

<pre>
{
  "AWSTemplateFormatVersion" : "2010-09-09",
  "Description" : "demo template",

  "Parameters" : {
    "subnet" : {
      "Type" : "String"
    },
    "image" : {
      "Type" : "String"
    },
    "key" : {
      "Type" : "String"
    }
  },

  "Resources": {
    "demo" : {
      "Type" : "AWS::EC2::Instance",
      "Properties" : {
        "SecurityGroups" : [ { "Ref" : "demogroup" } ],
        "KeyName" : { "Ref" : "key" },
        "ImageId" : { "Ref" : "image" },
        "InstanceType" : "m1.micro",
	"SubnetId" : { "Ref" : "subnet" },
        "Tags" : [
          {
            "Key": "Type",
            "Value": "demo"
          }
        ],
        UserData": {
          "Fn::Base64": {
            "Fn::Join": [
              "\n",
              [
                "#!/bin/sh",
                "echo hello world"
              ]
            ]
          }
        }
      }
    },
    "eip1" : {
      "Type" : "AWS::EC2::EIP",
      "Properties": {
        "InstanceId": { "Ref": "demo" },
        "Domain": "vpc"
      }
    },
    "demogroup" : {
      "Type" : "AWS::EC2::SecurityGroup",
      "Properties" : {
        "GroupDescription" : "Allow demo services",
        "SecurityGroupIngress" : [
          {
            "IpProtocol" : "tcp",
            "FromPort" : "22",
            "ToPort" : "22",
            "CidrIp" : "0.0.0.0/0"
          }
 
        ],
        "SecurityGroupEgress" : [{
          "CidrIp" : "0.0.0.0/0"
        }]
      }
    }
  }
}
</pre>

Here are the commands to create a new stack named demo using the template:

<pre>
myimage=$(nova image-list | grep centos-7.0 | awk '{print $2}')
heat stack-create -f demo.json demo \
  -P "subnet=$myprojectnet;image=$myimage;key=mykey"
</pre>

To show the details of the demo stack, run the following command:

<pre>
heat stack-show demo
</pre>


<h4>Other Resources</h4>

<ul>
<li><a href="http://www.openstack.org">OpenStack Web Site</a></li>
<li><a href="http://docs.openstack.org">OpenStack Documentation</a></li>
<li><a href="http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-template-resource-type-ref.html">CloudFormation Resource Types Reference</a></li>
</ul>
