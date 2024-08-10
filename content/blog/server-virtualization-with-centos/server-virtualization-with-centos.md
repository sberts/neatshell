---
title: "Server Virtualization with CentOS"
date: 2012-11-08T00:00:00-09:00
draft: false
featuredImage: "/img/centos.png"
tags: ["Linux", "CentOS", "libvirt"]
---

{% image "./centos.png", "centos logo" %}

CentOS Linux includes KVM and other software needed for managing virtual machines. This post shows how to create a virtual machine with an iSCSI storage backend. 

<h4>Install OS</h4>

<p>Download the latest version from the <a href="http://www.centos.org/">CentOS</a> web site and perform an install. Select the "minimal" install set.</p>

<p>Linux KVM performs much better if your hardware supports virtualization. Verify that your hardware is supported by running the following command:</p>

<pre>
grep "vmx|svm" /proc/cpuinfo
</pre>

<h4>Configure Network</h4>

<p>Configure eth0 as a management interface. Configure eth1 and eth2 for iSCSI. Configure eth3 for VM traffic. Split iSCSI interfaces between the onboard NIC and PCI adapter for redundancy.</p>

<p>Define network for libvirt.</p>

[code language="xml"]
&lt;network&gt;
  &lt;name&gt;testnet&lt;/name&gt;
  &lt;forward mode='bridge'/&gt;
  &lt;bridge name='br0'/&gt;
&lt;/network&gt;
[/code]

<h4>Install Virtualization Software</h4>

<p>Install Linux KVM, QEMU, libvirt. Reboot when you are finished.</p>

<pre>
yum update
yum groupinstall Virtualization "Virtualization Platform"
</pre>

<h4>Configure Storage</h4>

</p>For more information on building a storage server, check out this related post: <a href="/blog/openindiana-server/">Building a Storage Server with OpenIndiana</a>.</p>

<p>Install iSCSI and multipath software.</p>

<pre>
yum install iscsi-initiator-utils device-mapper-multipath
mpathconf --enable
</pre>

<p>Edit /etc/multipath.conf and set user_friendly_names to no.</p>

<p>Start multipathd.</p>

<pre>
chkconfig --level 345 multipathd on
service multipathd start
</pre>

<p>Discover iSCSI targets on 10.3.0.10.</p>

<pre>
iscsiadm -m discovery -t st -p 10.3.0.10
iscsiadm -m session
</pre>

<p>Check multipath.</p>

<pre>
multipath -ll
</pre>

<p>Manually define our storage pools with the XML below and virsh pool-define:</p>

[code lang="xml"]
&lt;pool type=&quot;iscsi&quot;&gt;
  &lt;name&gt;iscsipool&lt;/name&gt;
    &lt;source&gt;
      &lt;host name=&quot;10.3.0.10&quot;/&gt;
      &lt;device path=&quot;iqn.2010-09.org.openindiana:02:c379&quot;/&gt;
    &lt;/source&gt;
  &lt;target&gt;
    &lt;path&gt;/dev/disk/by-path&lt;/path&gt;
  &lt;/target&gt;
&lt;/pool&gt;

&lt;pool type=&quot;mpath&quot;&gt;
  &lt;name&gt;virtpool&lt;/name&gt;
  &lt;target&gt;
    &lt;path&gt;/dev/mapper&lt;/path&gt;
  &lt;/target&gt;
&lt;/pool&gt;
[/code]

<h4>Adding Virtual Machines</h4>

<p>Use the following command to create a virtual machine.</p>

<pre>
virt-install --name newvm --hvm --vcpus 1 --ram 512 --network \
  network:br0,mac=52:54:00:aa:cc:00
  --disk /dev/mapper/mylun,bus=virtio --vnc
</pre>

<p>To connect to the console use virt-manager or any VNC client.</p>

<h4>Other Resources</h4>

<ul>
<li><a href="http://www.centos.org/">CentOS Web Site</a>
</ul>
