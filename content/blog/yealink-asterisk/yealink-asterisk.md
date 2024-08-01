---
title: "Configuring a Yealink Phone for Asterisk"
date: 2013-02-19T00:00:00-09:00
draft: false
tags: ["Linux", "Networking", "Asterisk", "PowerConnect", "SIP", "VLAN", "VoIP", "YeaLink"]
---
{% image "./asterisk.png", "Asterisk logo" %}

<p>The Yealink SIP-T38G is a VoIP desk phone with two gigabit Ethernet ports. One port connects to the switch and the other connects to a user's PC. The PC port can be configured to act as a bridge so the phone and PC share the same physical network connection. Ethernet frames containing voice traffic are tagged and placed on a separate VLAN.</p>

&nbsp;
<h4>Configure Managed Switch</h4>

<p>This is how to configure the port on a Dell PowerConnect:</p>

<pre>
sw1(config)# interface ethernet 1/g14
sw1(config-if-1/g14)# description "workstation and phone"
sw1(config-if-1/g14)# switchport mode general
sw1(config-if-1/g14)# switchport general pvid 380
sw1(config-if-1/g14)# switchport general allowed vlan add 380
sw1(config-if-1/g14)# switchport general allowed vlan add 348 tagged
sw1(config-if-1/g14)# switchport general allowed vlan remove 1
sw1(config-if-1/g14)# exit
</pre>

<p>For more information on how to configure this switch, check out this previous post: <a href="{{ '/blog/dell-powerconnect/' | url }}">Using Dell PowerConnect Switches</a>.</p>

&nbsp;
<h4>Configure the Yealink SIP-T38G</h4>
Reset to the phone to the factory defaults. Hold down the 'OK' button for 10 seconds. Let the phone re-initialize. To configure the phone, go to Main Menu -> Settings -> Advanced Settings -> Network -> VLAN -> WAN Port. Set VLAN Status to enabled and set VID Number to the ID of your VoIP VLAN. Check Main Menu -> Status to confirm it received an IP address.

&nbsp;
<h4>Configure Asterisk</h4>

<p>Assuming Asterisk has already been configured, add a new phone to sip.conf. Create a template desk-phone and then add the Yealink phone.</p>

<pre>
[desk-phone](!)
type=friend
context=local-phone
host=dynamic
dtmfmode=auto
allow=ulaw
allow=alaw
allow=gsm

[yealink](desk-phone)
secret=SECRET-PASSWORD
</pre>

Reload sip.conf.
<pre>
*CLI> reload module chan-sip.so
</pre>

<p>Type the IP address of your phone into your web browser to open the web interface. Login using the credentials admin/admin. Open the Security Tab. Set a new password for the admin user.</p>

<p>Open the Account tab. Edit Account 1. Set Account Active to enabled. Enter the Register Name (this is your username), the User Name, the Password, and the SIP Server, then click on the Confirm button. Register Status should now be Registered.</p>

<p>Here is a link to Yealink's <a href="http://www.yealink.com/SupportDownloadfiles_detail.aspx?ProductsID=31&CateID=182&flag=142">Support Page</a> for the SIP-T38G. It contains links to the user guide and upgrade manual.</p>

<h4>Other Resources</h4>

<ul>
<li><a href="http://wiki.freepbx.org/display/FOP/Installing+FreePBX+13+on+CentOS+7">Installing FreePBX 13 on CentOS 7</a>
<li><a href="https://wiki.asterisk.org/wiki/display/AST/Secure+Calling">Asterisk Secure Calling</a>
</ul>
