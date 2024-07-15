---
title: "OSPF over VPN with VyOS"
date: 2014-08-23T00:00:00-09:00
draft: false
categories: ["Linux", "Networking"]
tags: ["GRE", "IPSec", "OSPF", "VPN", "VyOS"]
---
{% image "./vyos.png", "vyos logo" %}

<p>VyOS is a Linux-based firewall. It supports IPsec VPN, GRE tunnels, and the OSPF routing protocol. These features allow dynamic routing information to be exchanged between different private networks over a site-to-site VPN. More information on <a href="http://www.vyos.net">VyOS</a> can be found <a href="http://www.vyos.net">here.</a></p>

In this example, I have two VyOS firewalls with an IPsec VPN tunnel between them. There is a GRE tunnel inside the VPN tunnel which is needed for OSPF. Each VyOS firewall has 3 interfaces, but you could add many more. eth0 is used for external traffic (172.31.200.0/30 and 172.31.200.4/30). eth1 and eth2 are used for internal networks (10.200.0.0/24, 10.200.1.0/24, 10.200.4.0/24, and 10.200.5.0/24).

<h4>VyOS Firewall #1</h4>

<pre>
 interfaces {
     ethernet eth0 {
         address 172.31.200.2/30
         duplex auto
         hw-id 52:54:00:aa:aa:aa
         smp_affinity auto
         speed auto
     }
     ethernet eth1 {
         address 10.200.0.1/24
         duplex auto
         hw-id 52:54:00:aa:aa:bb
         smp_affinity auto
         speed auto
     }
     ethernet eth2 {
         address 10.200.1.1/24
         duplex auto
         hw-id 52:54:00:aa:aa:cc
         smp_affinity auto
         speed auto
     }
     loopback lo {
         address 192.168.200.1/32
     }
     tunnel tun0 {
         address 172.31.201.1/30
         encapsulation gre
         local-ip 192.168.200.1
         multicast disable
         remote-ip 192.168.200.2
     }
 }
 nat {
     source {
         rule 100 {
             outbound-interface eth0
             source {
                 address 10.200.0.0/22
             }
             translation {
                 address masquerade
             }
         }
     }
 }
 policy {
     route-map connect {
         rule 10 {
             action permit
             match {
                 interface lo
             }
         }
     }
 }
 protocols {
     ospf {
         area 0.0.0.1 {
             network 172.31.201.0/30
             network 10.200.0.0/24
             network 10.200.1.0/24
         }
         default-information {
             originate {
                 always
                 metric 10
             }
         }
         parameters {
             abr-type cisco
             router-id 192.168.200.1
         }
         redistribute {
             connected {
                 metric-type 2
                 route-map connect
             }
         }
     }
     ospfv3 {
     }
     static {
         route 0.0.0.0/0 {
             next-hop 172.31.200.1 {
             }
         }
     }
 }
 vpn {
     ipsec {
         esp-group esp-co {
             compression disable
             lifetime 3600
             mode tunnel
             pfs disable
             proposal 1 {
                 encryption 3des
                 hash sha1
             }
         }
         ike-group co {
             lifetime 7200
             proposal 1 {
                 dh-group 2
                 encryption 3des
                 hash sha1
             }
         }
         ipsec-interfaces {
             interface eth0
         }
         site-to-site {
             peer 172.31.200.6 {
                 authentication {
                     id 172.31.200.2
                     mode pre-shared-secret
                     pre-shared-secret sH4R3D-p4SSW0RD
                 }
                 connection-type initiate
                 default-esp-group esp-co
                 ike-group co
                 local-address 172.31.200.2
                 tunnel 1 {
                     allow-nat-networks disable
                     allow-public-networks disable
                     local {
                         prefix 192.168.200.1/32
                     }
                     protocol all
                     remote {
                         prefix 192.168.200.2/32
                     }
                 }
             }
         }
     }
 }
</pre>

<h4>VyOS Firewall #2</h4>

<pre>
 interfaces {
     ethernet eth0 {
         address 172.31.200.6/30
         duplex auto
         hw-id 52:54:00:bb:bb:aa
         smp_affinity auto
         speed auto
     }
     ethernet eth1 {
         address 10.200.4.1/24
         duplex auto
         hw-id 52:54:00:bb:bb:bb
         smp_affinity auto
         speed auto
     }
     ethernet eth2 {
         address 10.200.5.1/24
         duplex auto
         hw-id 52:54:00:bb:bb:cc
         smp_affinity auto
         speed auto
     }
     loopback lo {
         address 192.168.200.2/32
     }
     tunnel tun0 {
         address 172.31.201.2/30
         encapsulation gre
         local-ip 192.168.200.2
         multicast disable
         remote-ip 192.168.200.1
     }
 }
 nat {
     source {
         rule 100 {
             outbound-interface eth0
             source {
                 address 10.200.4.0/22
             }
             translation {
                 address masquerade
             }
         }
     }
 }
 policy {
     route-map connect {
         rule 10 {
             action permit
             match {
                 interface lo
             }
         }
     }
 }
 protocols {
     ospf {
         area 0.0.0.1 {
             network 172.31.201.0/30
             network 10.200.4.0/24
             network 10.200.5.0/24
         }
         parameters {
             abr-type cisco
             router-id 192.168.200.2
         }
         redistribute {
             connected {
                 metric-type 2
                 route-map connect
             }
         }
     }
     static {
         route 0.0.0.0/0 {
             next-hop 172.31.200.5 {
             }
         }
     }
 }
 vpn {
     ipsec {
         esp-group esp-co {
             compression disable
             lifetime 3600
             mode tunnel
             pfs disable
             proposal 1 {
                 encryption 3des
                 hash sha1
             }
         }
         ike-group co {
             lifetime 7200
             proposal 1 {
                 dh-group 2
                 encryption 3des
                 hash sha1
             }
         }
         ipsec-interfaces {
             interface eth0
         }
         site-to-site {
             peer 172.31.200.2 {
                 authentication {
                     id 172.31.200.6
                     mode pre-shared-secret
                     pre-shared-secret sH4R3D-p4SSW0RD
                 }
                 connection-type initiate
                 default-esp-group esp-co
                 ike-group co
                 local-address 172.31.200.6
                 tunnel 1 {
                     allow-nat-networks disable
                     allow-public-networks disable
                     local {
                         prefix 192.168.200.2/32
                     }
                     protocol all
                     remote {
                         prefix 192.168.200.1/32
                     }
                 }
             }
         }
     }
 }
</pre>

<h4>Summary</h4>

The VPN tunnel is on 192.168.200.0/30 and the GRE tunnel is on 172.31.201.0/30. Use the following command to check if your routes are getting distributed:

<pre>
$ show ip route
Codes: K - kernel route, C - connected, S - static, R - RIP, O - OSPF,
       I - ISIS, B - BGP, > - selected route, * - FIB route

S>* 0.0.0.0/0 [1/0] via 172.31.200.1, eth0
O   10.200.0.0/24 [110/10] is directly connected, eth1, 06w4d16h
C>* 10.200.0.0/24 is directly connected, eth1
C>* 10.200.1.0/24 is directly connected, eth2
O>* 10.200.4.0/24 [110/20] via 172.31.201.2, tun0, 00:02:44
O>* 10.200.5.0/24 [110/20] via 172.31.201.2, tun0, 00:00:08
C>* 127.0.0.0/8 is directly connected, lo
C>* 172.31.200.0/30 is directly connected, eth0
O   172.31.201.0/30 [110/10] is directly connected, tun0, 06w4d18h
C>* 172.31.201.0/30 is directly connected, tun0
C>* 192.168.200.1/32 is directly connected, lo
O   192.168.200.2/32 [110/20] via 172.31.201.2, 00:02:43
K>* 192.168.200.2/32 is directly connected, eth0
$
</pre>

Once you see the routes in this list, the networks can begin sending data to each other.
