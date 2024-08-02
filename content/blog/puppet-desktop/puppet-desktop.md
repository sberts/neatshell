---
title: "Configure a Desktop with Puppet"
description: This post describes how to setup a linux desktop with Puppet.
date: 2018-03-19
draft: false
tags: ["Linux", "CentOS", "i3wm", "Puppet", "Vim", "XRDP"]
---

{% image "./i3wm.png", "i3wm logo" %}
<p>This post will describe how to setup a Linux desktop from a minimal <a href="https://www.centos.org">CentOS 7</a> installation. Manually configuring all the software for a sysadmin is time-consuming and error-prone. We'll be using <a href="https://puppet.com/docs/puppet/5.0/index.html">Puppet 5</a> to help automate some of this.
<ul>
 	<li>Install EPEL repo, netcat, tcpdump, wget, git, and other tools</li>
 	<li>Install <a href="http://mah.everybody.org/docs/ssh">ssh-agent script</a></li>
 	<li>Install <a href="https://github.com/powerline/powerline">powerline</a> statusbar for various utilities</li>
 	<li>Install vim plugins (<a href="http://ethanschoonover.com/solarized">solarize</a>, <a href="https://github.com/rodjek/vim-puppet">vim-puppet</a>, syntastic, and snipmate)</li>
 	<li>Install <a href="https://i3wm.org">i3 window manager</a></li>
 	<li>Install <a href="https://www.xrdp.org">xrdp</a> remote desktop server</li>
       <li>Install <a href="https://pwsafe.org">PasswordSafe</a>
 	<li>Install Google Chrome and bookmarks</li>
</ul>

TODO: Add awscli and docker

If you don't already have puppet, use the following commands to install it:
<pre>
sudo rpm -Uvh https://yum.puppet.com/puppet5/puppet5-release-el-7.noarch.rpm
sudo yum install puppet-agent -y
</pre>

To run the manifest without a puppet master, these modules will need to be installed on the local machine.
<pre>
sudo /opt/puppetlabs/bin/puppet module install puppetlabs-stdlib
sudo /opt/puppetlabs/bin/puppet module install puppetlabs-vcsrepo
cd /etc/puppet/code/environments/production/modules
git clone https://github.com/sberts/puppet-desktop.git desktop
</pre>

With a Puppetfile:
<pre>
mod 'puppetlabs-stdlib', '4.25.0'
mod 'puppetlabs-vcsrepo', '2.3.0'
mod 'desktop',
  :git => 'https://github.com/sberts/puppet-desktop.git',
  :tag => '0.1.2'
</pre>

To apply without a Puppetmaster:
<pre>
sudo /opt/puppetlabs/bin/puppet apply -e "class { 'desktop': user => 'ec2-user', }"
</pre>

To customized parameters
<pre>
class { 'desktop':
  user              => 'myusername',
  install_ssh_agent => false,
  install_vim       => true,
  install_i3        => true,
  install_xrdp      => false,
  chrome_bookmarks  => [ 'https://github.com', 'https://aws.amazon.com' ],
}
</pre>

Parameters

user (string) - installs dot files in this users home directory

install_ssh_agent (boolean) - installs ssh_agent script and adds it to .bashrc

install_vim (boolean) - installs vim-enhanced, plugins, and .vimrc

install_i3 (boolean) - installs minimal window manager i3

install_xrdp (boolean) - installs and enables xrdp service

chrome_bookmarks (array) - list of bookmarks to add

If you are running a firewall you may need to open port 3389 before you can connect with RDP.
