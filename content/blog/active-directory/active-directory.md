---
title: Using Active Directory and Group Policy
description: This post describes the basics of Active Directory.
date: 2013-07-20
tags:
  - windows server 2008r2
  - active directory
  - group policy
---

{% image "./windows.png", "Windows logo" %}

Active Directory is a database used for storing information about users, computers, and network resources. Using AD integrated services allow systems administrators to centrally manage network resources and security policies on large networks.

## Domain Controllers
In order to use Active Directory, the Active Directory Domain Controller role needs to be installed. It's recommended to install it on at least two servers for fault tolerance. Each Domain Controller runs three main services. LDAP is a directory service used for storing information like usernames and passwords. Kerberos is an authentication service used to login. And DNS is used to resolve hostnames to IP addresses.

To begin, run <a href="https://technet.microsoft.com/en-us/library/cc732887(v=ws.11).aspx">dcpromo</a>. Follow the steps in the setup wizard. Create a new domain in a new forest and reboot when it finishes. For management purposes and to help delegate responsibilities, objects in Active Directory can be organized into Organizational Units. To manage OUs, click the Start menu, click Administrative tools, click Active Directory Users and Computers.

To use Active Directory, client computers will need to be joined to the domain. Make sure the DNS server settings are configured to point to the domain controller. Open Windows Explorer, right click on Computer, click Properties, click Change Settings, add computer and domain name, and click Add. Provide admin credentials when prompted, then reboot. 

## Group Policy
Group Policy allows you to have separate policies for different groups of computers. From the Start menu, browse to Administrative Tools and open the Group Policy Management Editor. Create a new GPO and link it to the domain or the OU containing the user and computer accounts.

### Passwords
Computer Configuration, Policies, Windows Settings, Security Settings, Account Policies, Password Policy.
- Edit Maximum password age setting.

### Screen Saver
User Configuration, Policies, Administrative Template, Control Panel, Personalization.
- Set Enable screen saver to enabled.
- Set Screen Saver timeout to enabled.
- Set Password protect the screen saver to enabled.


### Remote Desktop
Computer Configuration, Policies, Administrative Templates, Windows Components, Remote Desktop Services, Remote Desktop Session Host. Connections.
- Set Allow users to connect remotely using Remote Desktop Services to enabled.

### Windows Firewall
Computer Configuration, Policies, Administrative Templates, Network, Network Connections, Windows Firewall, Domain Profile.
- Set Allow ICMP Exceptions to enabled.
- Set Allow inbound remote administration exception to enabled.
- Set Allow inbound Remote Desktop exceptions to enabled.

### Restricted Groups
Give members from Active Directory access to Remote Desktop on client computers.

Computer Configuration, Policies, Windows Settings, Security Settings, Restricted Groups.
- Add Group. Use name Remote Desktop Users. Add user or group.

### Computer Certificates
If you have a Windows Server 2008 enterprise CA, configure auto-enrollment.

Computer Configuration, Policies, Windows Settings, Security Settings, Public Key Policies.
- Right click Automatic Certificate Request Settings, left click New Automatic Certificate Request. Select Computer.

### Windows Updates
Computer Configuration, Policies, Administrative Templates, Windows Components, Windows Update
- Set Configure Automatic Updates to enabled
- Set Specify intranet Microsoft update service location (if you have a local <a href="https://technet.microsoft.com/en-us/windowsserver/bb332157.aspx">WSUS</a> server)

## Other Resources
- <a href="https://technet.microsoft.com/en-us/library/cc732887(v=ws.11).aspx">dcpromo - TechNet</a>
- <a href="https://technet.microsoft.com/en-us/windowsserver/bb332157.aspx">Windows Server Update Services</a>
