---
title: "Installing WordPress using Puppet"
date: 2018-03-10T00:00:00-09:00
draft: false
tags: ["Linux", "CentOS", "WordPress", "Puppet", "Hiera", "MySQL", "PHP", "Apache", "SELinux"]
---
{% image "./wp.png", "WordPress logo" %}


<p>This post describes how to setup a basic web site running <a href="https://wordpress.org/">WordPress</a> using <a href="https://puppet.com/docs/puppet/5.3/puppet_platform.html">Puppet 5</a>. It assumes you are already running a Puppet server and you are using <a href="https://github.com/puppetlabs/r10k">r10k</a> with <a href="https://puppet.com/docs/pe/2017.3/managing_nodes/the_roles_and_profiles_method.html">roles and profiles</a>. This code was tested on CentOS 7.

TODO: Remove override attribute/add apache rewrite rules. Add Certbot.

We'll need these modules which are available from the <a href="https://forge.puppet.com">Puppet Forge</a>.
<ul>
<li><a href="https://forge.puppet.com/puppetlabs/apache">puppetlabs-apache</a></li>
<li><a href="https://forge.puppet.com/puppetlabs/mysql">puppetlabs-mysql</a></li>
<li><a href="https://forge.puppet.com/neillturner/wordpress">neillturner-wordpress</a></li>
</ul>

If you are using <a href="https://github.com/puppetlabs/r10k">r10K</a>, add them to the Puppetfile in your control repo.

<pre>
mod 'puppetlabs-apache', '3.0.0'
mod 'puppetlabs-mysql', '5.1.0'
mod 'neillturner-wordpress', '1.2.2'
</pre>

Create a new Puppet profile for <a href="https://wordpress.org/">WordPress</a>. This example will install WordPress in /opt/wordpress.

site/profile/manifests/wordpress.pp:
<pre>
class profile::wordpress {
  # set SELinux to allow apache to connect to mysql
  selboolean { 'httpd_can_network_connect_db':
    persistent => true,
    value => on,
  }

  # install apache
  class { 'apache':
    mpm_module => 'prefork',
    default_vhost => false,
  }

  # install php
  class {'::apache::mod::php': }

  # setup apache vhost for WordPress
  apache::vhost { lookup('profile::wordpress::apache_vhost'):
    port => '80',
    docroot => '/opt/wordpress',
    docroot_owner => 'apache',
    docroot_group => 'apache',
    override => 'All',
  }

  # install packages needed by WordPress
  package { [ 'wget', 'php-mysql' ]:
    ensure => present,
  }
  ->class { 'wordpress':
    version => '4.9.4',
    db_user => lookup('profile::wordpress::db_user'),
    db_password => lookup('profile::wordpress::db_password'),
    db_host => lookup('profile::wordpress::db_host'),
    db_name => lookup('profile::wordpress::db_name'),
    wp_owner => 'apache',
    create_db => true,
    create_db_user => true,
  }
  # fix SELinux context on uploads folder
  ->file { '/opt/wordpress/wp_content/uploads':
    ensure => directory,
    seltype => 'httpd_sys_rw_content_t',
  }
}
</pre>

Add this profile to a new role or add it to existing roles. Your settings are managed with hiera:

<pre>
profile::wordpress::apache_vhost: www.mysitename.com
profile::wordpress::db_user: myusername
profile::wordpress::db_password: mypassword
profile::wordpress::db_host: mydbhostname
profile::wordpress::db_name: mydbname
</pre>

For more information, check out the following links:
<ul>
<li><a href="https://puppet.com/docs/puppet/5.3/puppet_platform.html">Puppet 5 Platform</a></li>
<li><a href="https://forge.puppet.com/">The Puppet Forge</a></li>
<li><a href="https://puppet.com/docs/pe/2017.3/managing_nodes/the_roles_and_profiles_method.html">The roles and profiles method</a></li>
<li><a href="https://puppet.com/docs/puppet/5.4/hiera_intro.html">Introduction to Hiera</a></li>
<li><a href="https://wordpress.org/">WordPress blog tool</a></li>
</ul>
