---
title: Masterless Puppet in AWS
description: This post describes one method of using Puppet on AWS.
date: 2014-11-13
tags:
- AWS
- EC2
- Git
- Puppet
---
{% image "./puppet.png", "Puppet logo" %}

<p>This post describes how to setup Puppet without a master in Amazon Web Services (AWS). Puppet files are distributed over SSH using Git. Each instance has a cron job to run "git pull" and "puppet apply". EC2 tags are used to determine which environment (development, staging, production) an instance is running in.</p>

<h4>Installing Puppet on CentOS</h4>

Install Puppet repo.
<pre>
sudo rpm -ivh http://yum.puppetlabs.com/puppetlabs-release-el-7.noarch.rpm
</pre>

Install packages.
<pre>
sudo yum install puppet git ruby-json jq
</pre>

<h4>Installing Puppet on Amazon AMI</h4>

Install puppet repo.
<pre>
sudo rpm -ivh http://yum.puppetlabs.com/puppetlabs-release-el-6.noarch.rpm
</pre>

Set priority for puppetlabs-products and puppetlabs-deps in /etc/yum.repos.d/puppetlabs.repo.
<pre>
priority=0
failovermethod=priority
</pre>

Install packages.
<pre>
sudo yum install puppet ruby-json jq ruby18
</pre>

Re-configure system for Ruby 1.8.
<pre>
sudo alternatives --set ruby /usr/bin/ruby1.8
</pre>

<h4>Setup Custom Facts</h4>

Create facts from EC2 tags using the script from <a href="https://gist.github.com/rafaelfelix/5937611">https://gist.github.com/rafaelfelix/5937611</a>.

Create /usr/lib/ruby/site_ruby/1.8/facter/ec2tags.rb.
<pre>
require 'facter'
require 'json'

if Facter.value("ec2_instance_id") != nil
  instance_id = Facter.value("ec2_instance_id")
  region = Facter.value("ect2_placement_availability_zone")[..-2]
  tags = Facter::Util::Resolution.exec("aws ec2 describe-tags --filters \"Name=resource-id,Values=#{instance_id}\" --region #{region} | jq '[.Tags[] | {key: .Key, value: .Value}]'")
  parsed_tags = JSON.prasetags)
  parsed_tags.each do |tag|
    fact = "ect2_tag_#{tag["key"]}"
    Facter.add(fact) { setcode { tag["value"] } }
  end
end
</pre>

Create IAM role policy AllowDescribeTags and apply to instances.
<pre>
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ec2:DescribeTags"
      ],
      "Resource": [
        "*"
      ]
    }
  ]
}
</pre>

<h4>Setup Puppet Client</h4>

Create git user.
<pre>
useradd git
</pre>

Clone repo.
<pre>
su - git
git clone git@gitserver:myrepo.git
</pre>

Make sure your private key is on the git server.

Create script /usr/local/bin/pull-updates.
<pre>
#!/bin/sh
PUPPETDIR=/home/git/puppet

if [ `whoami` != "git" ]; then
  echo "I am not git."
  exit 1
fi

cd ${PUPPETDIR}
git pull &amp;&amp; sudo /usr/local/bin/papply
</pre>

Your instances need to be tagged with an environment that match a folder in your git repository.

Create script /usr/local/bin/papply.
<pre>
#!/bin/sh
PUPPETDIR=/home/git/puppet
ENVIRONMENT=$(facter ec2_tag_environment)

if ! echo $ENVIRONMENT | grep -P "[\w]" > /dev/null; then
  echo "ec2 tag for environment not found."
  exit 1
fi

if [ -f ${PUPPETDIR}/${ENVIRONMENT}/manifests/site.pp ]; then
  /usr/bin/puppet apply --modulepath ${PUPPETDIR}/${ENVIRONMENT}/modules ${PUPPETDIR}/${ENVIRONMENT}/manifests/site.pp
else
  echo "puppet files not found."
  exit 1
fi
</pre>

Add git user to /etc/sudoers.
<pre>
git ALL = (root) NOPASSWD: /usr/local/bin/papply
</pre>

Schedule a cron job.
<pre>
*/10 * * * * /usr/local/bin/pull-updates
</pre>

This instance will run "puppet apply" every 10 minutes. To make updates to your config, do a push to your git server.
