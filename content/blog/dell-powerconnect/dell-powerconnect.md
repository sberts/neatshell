---
title: Using a Dell PowerConnect Switch
description: This post describes the basics of using a Dell PowerConnect switch.
date: 2012-12-15
tags:
  - Dell PowerConnect
  - LACP
  - SNMP
  - VLAN
---
{% image "./dell.png", "Dell logo" %}

In this post I'll describe how to configure different features on Dell PowerConnect switch.

## Reset to Factory Default

To configure the switch, you'll want to connect to the serial console on the back of the unit. Reset configuration to factory defaults.

```
console> enable
console# delete startup-config
console# reload
```

Skip the setup wizard to configure manually. Set the hostname and password.

```
console> enable
console# config
console(config)# hostname sw1
sw1(config)# username admin password <i>your-new-password</i> level 15
```

## VLAN

VLANs allow you to partition your network to create multiple distinct broadcast domains. They must be defined before they can be used.

```
sw1(config)# vlan database
sw1(config-vlan)# vlan 300-301,316,332,348,364,380,396
sw1(config-vlan)# exit
```

## Remote Management

Configure the IP address of the switch. Place it on a VLAN so management traffic can be routed.

```
sw1(config)# interface vlan 316
sw1(config-vlan)# routing
sw1(config-vlan)# ip address 10.3.16.2 255.255.240.0
sw1(config-vlan)# exit
sw1(config)# ip routing
sw1(config)# ip route 0.0.0.0 0.0.0.0 10.3.16.1
```

## SSH

Enable SSH for remote management.

```
sw1(config)# crypto key generate dsa
sw1(config)# crypto key generate rsa
sw1(config)# ip ssh server
```

## Trunk Mode

Configure an interface with VLAN trunking for the firewall.

```
sw1(config)# interface ethernet 1/g1
sw1(config-if-1/g1)# description "firewall"
sw1(config-if-1/g1)# switchport mode trunk
sw1(config-if-1/g1)# switchport trunk vlan add 316,332,348,364,380,396
sw1(config-if-1/g1)# exit
```

## Access Mode

Configure four interfaces to be used by a virtual host.

```
sw1(config)# interface ethernet 1/g2
sw1(config-if-1/g2)# description "virtual host"
sw1(config-if-1/g2)# switchport mode access
sw1(config-if-1/g2)# switchport access vlan 316
sw1(config-if-1/g2)# exit
sw1(config)# interface ethernet 1/g3
sw1(config-if-1/g3)# description "virtual guests"
sw1(config-if-1/g3)# switchport mode trunk
sw1(config-if-1/g3)# switchport trunk allowed vlan add 348,364,380,396
sw1(config-if-1/g3)# exit
sw1(config)# interface ethernet 1/g4
sw1(config-if-1/g4)# description "virtual host iscsi 0"
sw1(config-if-1/g4)# switchport mode access
sw1(config-if-1/g4)# switchport access vlan 300
sw1(config-if-1/g4)# exit
sw1(config)# interface ethernet 1/g5
sw1(config-if-1/g5)# description "virtual host iscsi 1"
sw1(config-if-1/g5)# switchport mode access
sw1(config-if-1/g5)# switchport access vlan 301
sw1(config-if-1/g5)# exit
```

## LACP

Configure a pair of interfaces for bonding/teaming and enable LACP (802.3ad).

```
sw1(config)# interface ethernet 1/g9
sw1(config-if-1/g9)# channel-group 1 mode auto
sw1(config-if-1/g9)# exit
sw1(config)# interface ethernet 1/g10
sw1(config-if-1/g10)# channel-group 1 mode auto
sw1(config-if-1/g10)# exit
sw1(config)# interface port-channel 1
sw1(config-if-ch1)# switchport mode access
sw1(config-if-ch1)# switchport access vlan 364
sw1(config-if-ch1)# exit
sw1(config)# exit
```

## Save Config

Save your config.

```
sw1# copy running-config startup-config
```

## Enable SNMP

Optionally, you can enable SNMP for remote monitoring.

```
sw1(config)# snmp-server contact "admin at neatshell dot com"
sw1(config)# snmp-server location "homelab"
sw1(config)# snmp-server community public ro ipaddress <i>ip-of-your-snmp-agent</i>
```

## Install MRTG

Install and configure MRTG.

```
root@wopr:~# yum install mrtg
root@wopr:~# cfgmaker public@10.3.16.2 > /etc/mrtg/mrtg.cfg
```

Edit mrtg.cfg and add the following:
```
HtmlDir: /var/www/mrtg
ImageDir: /var/www/mrtg
LogDir: /var/lib/mrtg
ThreshDir: /var/lib/mrtg
Options[_]: growright, bits
```

Use indexmaker to generate a index.html file.

```
root@wopr:~# indexmaker /etc/mrtg/mrtg.cfg > /var/www/mrtg/index.html
```

Open http://servername/mrtg in your web browser.

## Other Resources

The full <a href="http://support.dell.com/support/edocs/network/pc62xx/en/index.htm">documentation</a> for this switch is available on the <a href="http://support.dell.com/support/edocs/network/pc62xx/en/index.htm">Dell web site</a>. 

Or, check out this <a href="http://en.community.dell.com/support-forums/network-switches/f/866/p/19445143/20089158.aspx">post</a> on the <a href="http://en.community.dell.com/support-forums/network-switches/f/866/p/19445143/20089158.aspx">Dell support forum</a> for more examples.
