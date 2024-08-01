---
title: "Raspberry Pi Media Player"
date: 2012-12-28T00:00:00-09:00
draft: false
tags: ["Linux", "Raspberry PI", "RPi"]
---
{% image "./rpi.png", "Raspberry Pi logo" %}

<p>The Raspberry Pi Model B is a $35 computer about the size of a deck of playing cards. It contains an ARM11 processor running at 700Mhz (overclockable), 512MB RAM, HDMI port, SD card slot, USB ports, and a RJ45 network adapter. Its low power consumption and ability to play some HD video make it a viable option for a budget HTPC. For more information about the <a href="http://www.raspberrypi.org/">Raspberry Pi</a>, check out their <a href="http://www.raspberrypi.org/">web site</a>.</p>

It can be purchased from several distributors. If you don't feel like searching for one, just browse over to <a href="http://www.element14.com/community/groups/raspberry-pi">element 14.</a> It will need a <a href="http://elinux.org/RPi_SD_cards">SD card</a> to boot from. A list of brands/models that have been verified to work can be found <a href="http://elinux.org/RPi_SD_cards">here.</a>

The software I'll be using is a Debian Linux-based distribution named <a href="http://www.raspbmc.com/about/">Raspbmc.</a> It includes <a href="http://xbmc.org/about/">XBMC</a> which is a popular media center software. It's available for download <a href="http://www.raspbmc.com/download/">here</a>. No experience with Linux is necessary.  The installation is fairly straight-forward. Insert your SD card into your computer and run a script to copy some files onto your SD card. Then, insert the SD card into your Raspberry Pi and connect it to your TV and to your network. Make sure you have a DHCP server available. Boot it up and it should go through the rest of the installation automatically.

The full instructions are available on the <a href="http://www.raspbmc.com/wiki/user/">Raspbmc User Wiki</a> for <a href="http://www.raspbmc.com/wiki/user/windows-installation/">installing via Windows</a> and <a href="http://www.raspbmc.com/wiki/user/os-x-linux-installation/">installing via Mac OS X or Linux</a>.

Once it completes, you'll want to tell XBMC where your media files are located. Typically, this will either be a USB hard drive or a shared folder on your desktop computer. You may also want to install additional software such as the YouTube add-on to stream videos from the YouTube web site.

Android users will want to download <a href="https://play.google.com/store/apps/details?id=org.leetzone.android.yatsewidgetfree">Yatse,</a> a free app for your smartphone or tablet which acts as a remote control. Edit your settings in Yatse to add the IP address of your Raspberry Pi and you should be ready to start enjoying your new HTPC.
