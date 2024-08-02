---
title: Configuring Juniper SRX
description: This post describes configuring a Juniper SRX.
date: 2012-12-06
tags:
- Networking
- DHCP
- Juniper SRX
- VLAN
---

{% image "./junos.png", "JunOS logo" %}
Juniper SRX devices running JunOS offer high-performance routing and packet filtering. This post shows some basic commands to get started.</p>

## Update Software

Copy latest version of software to the SRX via SSH. Install the software update and reboot.

request system software add /var/tmp/junos-*.tar.gz no-copy
request system reboot
</pre>

<h4>Set Password</h4>

Get rid of old settings and set new password.

<pre>
delete system
delete interfaces
delete security
set system root-authentication plain-text-password
Password:
set system services ssh
</pre>

<h4>Configure Logging</h4>

Configure remote logging and alerts.

<pre>
set host 10.3.16.2 source-address 10.3.16.1 external any
set user * any emergency
</pre>

<h4>Configure Interfaces</h4>

Dedicate a GigE port to Internet traffic. Dedicate another GigE port for internal traffic with VLAN tagging.

<pre>
set interface ge-0/0/0 unit 0 family inet dhcp
set interface ge-0/0/1 vlan-tagging
set interface ge-0/0/1 unit 316 vlan-id 316
set interface ge-0/0/1 unit 316 family inet address 10.3.16.1/20
set interface ge-0/0/1 unit 332 vlan-id 332
set interface ge-0/0/1 unit 332 family inet address 10.3.32.1/20
</pre>

<h4>Security Zones</h4>

Create the following security zones to place network resources in:

<ul>
<li>mgmt (VLAN 316) - This is a management zone.</li>
<li>guest (VLAN 332) - This zone contains end-user systems.</li>
</ul>

<pre>
set security zone security-zone inet interfaces ge-0/0/0.0 host-inbound-traffic system-services dhcp
set security zone security-zone mgmt host-inbound-traffic system-services ssh
set security zone security-zone mgmt host-inbound-traffic system-services ping
set security zone security-zone addressbook address sshserver 10.3.16.2/32
set security zone security-zone mgmt interfaces ge-0/0/1.316
set security zone security-zone guest interfaces ge-0/0/1.332 host-inbound-traffic system-services dhcp
</pre>

<h4>DHCP Server Settings</h4>

Setup DHCP server for guest, voip, sensitive, and public.

<pre>
set system services dhcp pool 10.3.32.0/20 address-range low 10.3.34.0 high 10.3.34.255
set system services dhcp pool 10.3.32.0/20 router 10.3.32.1
set system services dhcp pool 10.3.32.0/20 name-server 8.8.8.8
set system services dhcp pool 10.3.32.0/20 propagate-settings ge-0/0/1.332
</pre>

<h4>Network Address Translation</h4>

Setup source NAT.
<pre>
set security nat source rule-set nat from zone mgmt
set security nat source rule-set nat from zone guest
set security nat source-rule-set nat to zone inet
set security nat source-rule-set nat rule source-nat-rule match source-address 0.0.0.0/0
set security nat source-rule-set nat rule source-nat-rule then source-nat interface
</pre>

<h4>Port Forwarding</h4>
Setup port forwarding for incoming SSH and HTTP connections.

<pre>
set security nat destination pool ssh address 10.3.16.2/32
set security nat destination rule-set incoming-nat from zone inet
set security nat destination rule-set incoming-nat rule ssh match destination-address 0.0.0.0/0 destination-port 22
set security nat destination rule-set-incoming-nat rule ssh then destination-nat pool ssh
</pre>

<h4>Security Policies</h4>

Set security policies.

<pre>
set security policies from-zone inet to-zone public policy ssh-to-sshserver match source-address any destination-address sshserver application junos-ssh
set security policies from-zone inet to-zone public policy ssh-to-ssh-server then permit
</pre>

<h4>Backup Config</h4>

Exit configuration mode

<pre>
file copy /config/juniper.conf.gz backup@backup-server:
</pre>

<h4>Other Resources</h4>

<ul>
<li><a href="http://www.juniper.net">Juniper Web Site</a></li>
<li><a href="http://www.juniper.net/techpubs/en_US/release-independent/junos/information-products/pathway-pages/srx-series/product/index.html">Juniper SRX Technical Documentation</a></li>
</ul>
