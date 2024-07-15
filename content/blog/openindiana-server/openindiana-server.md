---
title: Building a Storage Server using OpenIndiana
description: This post describe how to use OpenIndiana to build a storage server
date: 2012-06-23
tags:
- iSCSI
- OpenIndiana
- OpenSolaris
- ZFS
---

{% image "./openindiana.png", "OpenIndiana logo" %}
<p>This post describes how to build a storage server using the OpenIndiana operating system. OpenIndiana is free, open-source, and based on OpenSolaris. It includes ZFS which provides features like software RAID. OpenIndiana can also act as iSCSI target. For my setup, I'm using 1 SSD and 4 HDDs. I created 2 partitions on the SSD. One partition is for the operating system. The second partition is for the ZFS read cache.</p>

<h4>Install OS</h4>

Download the latest version from the <a title="OpenIndiana" href="http://openindiana.org" target="_blank">OpenIndiana web site.</a> Create two partitions on the SSD for the operating system and L2ARC. Continue through the installation process. After it has completed, reboot and login as root.

<h4>Configure Network Settings</h4>

Use this command to view your network interfaces:

<pre>
dladm show-phys
</pre>

Configure the management network on e1000g0.

<pre>
svcadm disable svc:/network/physical:nwam
svcadm enable svc:/network/physical:default
ipadm create-addr -T static -a 10.3.16.10/20 e1000g0/v4
route -p add default 10.3.16.1
echo nameserver 8.8.8.8 > /etc/resolv.conf
cp /etc/nsswitch.dns /etc/nsswitch.conf
</pre>

iSCSI supports multi-path which allows for redundant physical paths and better utilization of multiple network links. Configure e1000g1 and e1000g2 and place them on different subnets.

<pre>
ipadm create-addr -T static -a 10.3.0.10/24 e1000g1/v4
ipadm create-addr -T static -a 10.3.1.10/24 e1000g2/v4
</pre>

Now that your network is setup, you can install updates.

<pre>
pkg update
</pre>

<h4>Configure iSCSI Target</h4>

Run the following commands to setup iSCSI on the server.

<pre>
pkg install -v SUNWiscsit
svcadm enable -r svc:/network/iscsi/target:default
itadm create-tpg tpg1 10.3.0.10 10.3.1.10
itadm create-target -t tpg1
</pre>

<h4>Add Storage Pool</h4>

Find your disks using this command:

<pre>
ls /dev/dsk | grep -P "d0$"
</pre>

Using the disks found in the last command, create the new storage pool with the following commands:

<pre>
zpool create bigpool mirror c3t5Ad0 c3t5Bd0
zpool add bigpool mirror c3t5Cd0 c3t5Dd0
</pre>

Use a SSD for read cache.

<pre>
zpool add bigpool cache c5t0d0p2
</pre>

<h4>Manage Volumes</h4>

Create a new volume with the following command:

<pre>
zfs create -V10G bigpool/vol1
LU=`sbdadm create-lu /dev/zvol/rdsk/bigpool/vol1 | grep -P"^[0-9]" | \
awk '{print $1}'`
stmfadm add-view $LU
</pre>

Monitor performance.

<pre>
zpool iostat -v bigpool 2
</pre>

You can grow your volumes online using the follow commands:

<pre>
zfs set volsize=20G dpool/vol1
sbdadm modify-lu -s 20g /dev/zvol/rdsk/bigpool/vol1
</pre>

For more information, check out these links:
<ul>
<li><a href="http://openindiana.org">OpenIndiana Web Site</a></li>
<li><a title="ZFS Best Practices Guide" href="http://solarisinternals.com/wiki/index.php/ZFS_Best_Practices_Guide">ZFS Best Practices Guide</a></li>
<li><a title="Using OpenIndiana/Nexenta/Solaris with ZFS, COMSTAR, Microsoft iSCSI initiator, and LUN Masking" href="http://broken.net/solaris/using-openindiananexentasolaris-with-zfs-comstar-microsoft-iscsi-initiator-and-lun-masking/">Jason Matthews</a>' blog</li>
</ul>
