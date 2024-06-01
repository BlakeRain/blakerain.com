---
title: Setting Up a Firewall with Raspberry Pi and OpenBSD
tags:
  - openbsd
  - raspi
date: 2024-05-30T20:31:11.332Z
summary: |
  Tired with my current firewall, I have decided to switch over to a Raspberry Pi 4 running
  OpenBSD. In this post I describe how I did this and the problems that I ran into.
draft: true
---

For quite a while now I've wanted to replace my current firewall. I'm currently using a WatchGuard
firewall, which I find to be quite troublesome. I also rather dislike the fact that I had to pay
hundreds of pounds to buy it, and then pay hundreds more every year to use it.

So this week I took it upon myself to set up a router at the apex of my network using a Raspberry
Pi. I decided that I would use OpenBSD for this.

{{< callout type=tip >}} There is an amazing guide called the
[OpenBSD Router Guide](https://openbsdrouterguide.net/), which can also be found on
[GitHub](https://github.com/unixdigest/openbsd-router-guide). A lot of what follows was draw from
this guide, the OpenBSD manpages, and the
[OpenBSD PF User Guide](https://www.openbsd.org/faq/pf/index.html). {{</callout>}}

# Why not pfSense?

I had originally discussed my plan with a colleague, back when I originally wanted to switch over to
pfSense. However, I don't really want to use pfSense anymore, or the derivative OPNSense. My reasons
are fairly vague and subjective, and probably not worth going into too much.

My main gripe is that pfSense (and therefore OPNSense) are based on FreeBSD. Not that I have a
problem with FreeBSD, but my choice for a firewall appliance would almost always be OpenBSD. OpenBSD
is more heavily focused on security and correctness, aiming to be a complete and secure system OOTB
that favours simplicity over features. FreeBSD, on the other hand, focuses more on performance,
scalability and cutting-edge features.

Don't get me wrong, FreeBSD is very widely adopted and has very good application support. Certainly
FreeBSD is suitable for general purpose compute, but I'm not entirely sure it's the BSD I'd pick for
a firewall.

It seems to me that the main reasons that pfSense and their kin use FreeBSD are:

1. pfSense was a fork from [m0n0wall](https://en.wikipedia.org/wiki/M0n0wall), which already used
   FreeBSD.
2. FreeBSD has better wireless support than OpenBSD.
3. FreeBSD has much better network performance (such as multi-processor support for PF packet
   filters). OpenBSD lacks a number of performance optimisations.

On the second point, I'm not hugely in favour of my WAP being built in to my firewall. I'd rather
have the device at the apex of my network focused entirely on being the router for that network. I
find that using a separate WAP to be preferable.

# Installing OpenBSD on a Raspberry Pi

I intend to install OpenBSD on a Raspberry Pi and set up the router configuration myself. To start
with, I'll need to install OpenBSD on a Raspberry Pi.

{{< callout type=tip >}} The
[OpenBSD 7.5 arm64 installation instructions](https://ftp.openbsd.org/pub/OpenBSD/7.5/arm64/INSTALL.arm64)
are very informative. {{</callout>}}

To begin with, I selected a Raspberry Pi 4B and used a latest Raspberry Pi OS to update the firmware
to the latest version so that I could boot from USB. I then changed the boot order using
`raspi-config` to boot from USB before the microSD. Once completed, I was ready to prepare the
installation media for OpenBSD.

The first problem I had was that I thought I'd need to use the Raspberry Pi UEFI firmware in the
OpenBSD [ARM64](https://ftp.openbsd.org/pub/OpenBSD/7.5/arm64/) installation image. I downloaded
[v1.37](https://github.com/pftf/RPi4/releases/tag/v1.37) of the Raspberry Pi firmware, then mounted
the FAT16 partition at the start of the OpenBSD installation image (`install75.img`). I copied all
the files from the UEFI firmware into that new partition. As usual, there was a problem: the
`install75.img` has the partition configured to be very small. So small that I cannot fit the actual
UEFI firmware onto the partition.

In order to get the new firmware onto the boot partition I first wrote the `install75.img` image
file to a USB stick. I then plugged the stick into a Linux machine. On that machine I was able to
use GParted to move the BSD partition to the right and resize the FAT16 boot partition.
Unfortunately, GParted cannot resize a FAT16 filesystem. To deal with this I mounted the boot
partition, copied the contents to another directory, and added all the UEFI firmware files there,
overwriting anything in the process. Then I deleted the existing FAT16 partition and created a new
one to fill the boot partition (remembering to set the boot and LBA flags). I then copied the
modified contents back into this new filesystem.

None of that worked, and OpenBSD could not boot. Mostly it seems that the moved BSD partition was
broken.

{{< figure src="Pasted%20image%2020240528130110.jpg" title="I've broken the partitions" >}}

## Booting without UEFI Firmware

For a second attempt, I decided to try `install75.img` without any of the Raspberry Pi UEFI
firmware. Turns out that it booted fine. However there was another issue: typical OpenBSD doesn't
forward the TTY to the frame-buffer, instead expecting you to attach a serial interface. I didn't
have the energy for that noise, and luckily you can interrupt the auto-boot and use `set tty fb0` to
redirect the TTY to the frame-buffer before continuing with the boot.

{{< figure src="Pasted%20image%2020240528130245.jpg" title="Behold! The glorious OpenBSD installation program" >}}

## Installing OpenBSD

I shan't belabour with a blow-by-blow account of the installation of OpenBSD. The installation
program for OpenBSD is very good, and a joy to use.

I did have a small issue with getting the sets installed as the installer was unable to connect to
`openbsd.org`. Instead I had to point it to `ftp.eu.openbsd.org` to continue. After a short while,
the installer had downloaded all the sets and was ready to reboot.

{{< figure src="IMG_3764.jpg" title="OpenBSD installer has completed installation of all sets" >}}

{{< figure src="IMG_3765.jpg" title="OpenBSD installation is complete" >}}

With the installation complete and the system rebooted, I can log in using the root password that I
set during the installation. Now I can start configuring the OpenBSD system to be my router and a
firewall.

{{< figure src="Pasted%20image%2020240528131841.png" title="Connecting to OpenBSD for the first time" >}}

On a side note, I really rather like the way that OpenBSD mails you a list of responses provided
during installation.

{{< figure src="CleanShot%202024-05-28%20at%2013.11.58.png" title="OpenBSD email of installation responses" >}}

## USB Ethernet Adapter

One small drawback to using a Raspberry Pi was that it only had a single Ethernet port. In order to
operate as a gateway, I needed to add another Ethernet port. I decided on using a USB Ethernet
adapter, and that I would use that adapter for the connection to the ASDL modem, as my Internet
connection is only about 65 Mbps.

The only USB Ethernet adapter I had laying around was an old Microsoft adapter that I used to use
with a Microsoft Surface. After messing about a little, I found that I could attach it:

{{< figure src="Pasted%20image%2020240528132933.png" title="Microsoft USB Ethernet adapter attached" >}}

This Microsoft adapter identifies to OpenBSD as an RTL8251 PHY and RTL8153:

{{< figure src="CleanShot%202024-05-28%20at%2013.30.38.png" title="Snapshot of dmesg output when connected" >}}

{{< callout type=note >}} Unfortunately I am later going to find that this adapter was broken.
{{</callout>}}

# Setting Up a Router in OpenBSD

Using `ifconfig` I was able to take a look at the current state of the network interfaces available:

{{< figure src="CleanShot%202024-05-28%20at%2013.35.13.png" title="Output of ifconfig" >}}

There are two interfaces in this list that were of interest to me:

1. The Raspberry Pi's built-in Ethernet NIC is listed as the `bse0` interface, is attached to my LAN
   switch, and has the IPv4 address `192.168.0.215` (this is how I am connecting over SSH).
2. The Microsoft USB adapter is `ure0` and is not attached to anything presently, hence the
   `no carrier` status (_ominous rumble of foreboding_).

I'm intended to use the built-in `bse0` port as the LAN connection, so it will remain connected to
my LAN switch. The `ure0` USB Ethernet adapter will be connected to my ADSL modem in place of the
WatchGuard.

Before I got to the router configuration, I first needed to make sure that I was able to configure
OpenBSD to connect to my Internet.

## PPPoE for Internet

My ISP requires PPPoE for my Internet connection. I've never really configured PPPoE before, so I
had to consult the manpages on [PPoE](https://man.openbsd.org/pppoe) and
[ifconfig](https://man.openbsd.org/ifconfig.8). Even then I ended up making some fairly basic
mistakes.

To start with, I needed to setup the PPPoE interface. I did this by creating an
`/etc/hostname.pppoe0` file with the following contents:

```
inet 0.0.0.0 255.255.255.255 NONE \
pppoedev ure0 authproto chap \
authname '<username>' authkey '<password>' up
dest 0.0.0.1
```

```callout type=note
I'm using placeholders here for my username and password
```

The username and password I was able to get from the connection details provided by my ISP. They
also confirmed that the authentication protocol was CHAP. According to the PPPoE manpage, using the
wildcard address `0.0.0.0` as the local address is sufficient, as it will be replaced with the
address suggested by my ISP. In addition, the address `0.0.0.1` in the destination will also be
replaced with the address suggested by the peer.

I then created the `/etc/hostname.ure0` to configure the Microsoft USB Ethernet interface:

```
up
```

With those settings in place, I used [netstart](https://man.openbsd.org/netstart.8) script to apply
these configuration changes by running `sh /etc/netstart`. I then moved the ADSL modem from the
WatchGuard and to the USB adapter.

This is where I ran into a problem with the Microsoft USB adapter. The `status` was always being
reported as `no carrier`. I tried a different cable, and also tried connecting it to my LAN switch.
In the end, I had to admit defeat: either the adapter was broken or there was a driver issue.

This somewhat stumped my progress until Amazon could deliver me a
[TP-Link UE306](https://www.tp-link.com/us/home-networking/usb-converter/ue306/) the following day.

Once I had received the new interface and got it connected I changed the configuration in the
`/etc/hostname.pppoe0` to the name of the new device, replacing `ure0` with `axen0`:

```
inet 0.0.0.0 255.255.255.255 NONE \
pppoedev axen0 authproto chap \
authname '<username>' authkey '<password>' up
dest 0.0.0.1
```

After reconnecting the modem to this new USB Ethernet adapter, I checked `ifconfig` to see how the
PPPoE was progressing, only to see that the status of the `pppoe0` interface was `inactive`. To try
and identify the cause I set debugging on the `pppoe0` interface, took it down, and then brought it
back up:

```
# ifconfig pppoe0 debug
# ifconfig pppoe0 down
# ifconfig pppoe0 up
```

This caused some information to be written to the syslog (found in `/var/log/messages`). I could see
that the CHAP authentication was proceeding as expected and that it had actually succeeded, but that
the rest of the session configuration had failed.

```
May 29 15:49:41 white /bsd: pppoe0: chap success
May 29 15:49:41 white /bsd: pppoe0: phase network
May 29 15:49:41 white /bsd: pppoe0: ipcp open(starting)
May 29 15:49:41 white /bsd: pppoe0: ipv6cp_open(): no IPv6 interface
May 29 15:49:41 white /bsd: pppoe0: lcp close(opened)
May 29 15:49:41 white /bsd: pppoe0: lcp opened->closing
May 29 15:49:41 white /bsd: pppoe0: lcp output <term-req id=0x67 len=4>
May 29 15:49:41 white /bsd: pppoe0 (8864) state=3, session=0x1a25 output -> 25:26:2b:1a:aa:0e, len=12
May 29 15:49:41 white /bsd: pppoe0: phase terminate
May 29 15:49:41 white /bsd: pppoe0: lcp input(closing): <term-ack id=0x67 len=4 00-...-00>
May 29 15:49:41 white /bsd: pppoe0: lcp closing->closed
May 29 15:49:41 white /bsd: pppoe0: phase dead
May 29 15:49:41 white /bsd: pppoe0: timeout
May 29 15:49:41 white /bsd: pppoe0: disconnecting
May 29 15:49:41 white /bsd: pppoe0: lcp down(closed)
May 29 15:49:41 white /bsd: pppoe0: lcp closed->initial
May 29 15:49:41 white /bsd: pppoe0: Down event (carrier loss), taking interface down.
```

This drove me on a number of wild chases. The message `no IPv6 interface` certainly lead me down a
rabbit hole, as I checked to make sure my ISP did not support IPv6 addresses and that I was not
actually attempting to configure anything IPv6 related. Turns out, a simple reboot made the problem
go away 🙄

After a reboot, the debug messages showed the CHAP authentication completing and the network phase
completing. My red herring `no IPv6 interface` message was still there, indicating it was probably
fairly benevolent.

Moreover, I could see in the output of `ifconfig` that the `pppoe0` interface was up and running,
and that the `inet` address was reporting the IP address I expected.

```
axen0: flags=8843<UP,BROADCAST,RUNNING,SIMPLEX,MULTICAST> mtu 1500
        lladdr 7c:c2:c6:3b:38:a2
        index 5 priority 0 llprio 3
        media: Ethernet autoselect (1000baseT full-duplex)
        status: active
pppoe0: flags=8851<UP,POINTOPOINT,RUNNING,SIMPLEX,MULTICAST> mtu 1492
        index 6 priority 0 llprio 3
        dev: axen0 state: session
        sid: 0x1a29 PADI retries: 2 PADR retries: 0 time: 03:25:17
        sppp: phase network authproto chap authname "<username>"
        dns: <dns-ip-1> <dns-ip-2>
        groups: pppoe egress
        status: active
        inet <my-ip> --> <isp-ip> netmask 0xffffffff
pflog0: flags=141<UP,RUNNING,PROMISC> mtu 33136
        index 7 priority 0 llprio 3
        groups: pflog
```

This is where I ran into my next problem: no default route. For some reason, I assumed that PPPoE
would automatically add a default route via the `pppoe0` interface. Turns out that this is not the
case, and that I needed to add it manually with: `route add default -ift pppoe0 <isp-ip>`. Rather
than have to do this every time, the example in the manpage for `pppoe` suggests adding a line to
the end of the `/etc/hostname.pppoe0` file to run the `route` command, substituting the wildcard
address for the destination suggested by the ISP (which I had assumed would be automatic).

My `/etc/hostname.pppoe0` configuration now reads as follows:

```
inet 0.0.0.0 255.255.255.255 NONE \
pppoedev axen0 authproto chap \
authname '<username>' authkey '<password>' up
dest 0.0.0.1
!/sbin/route add default -ifp pppoe0 0.0.0.1
```

After adding the default route I was able to connect to the Internet from the Raspberry Pi without
issue.

## Router Configuration

Now that I had the PPPoE up and running I needed to set up the device as a router. To begin with, I
needed to enable IPv4 forwarding using the `sysctl` command, and then permanently enable it by
writing the setting into the `/etc/sysctl.conf` file:

```
# sysctl net.inet.ip.forwarding=1
# echo 'net.inet.ip.fowrarding=1' >> /etc/sysctl.conf
```

Next I needed to configure the Raspberry Pi's built-in Ethernet port, listed as `bse0`. To do this I
created an `/etc/hostname.bse0` file with the following contents:

```
inet 192.168.1.1 255.255.255.0 NONE
```

Using `/etc/netstart` to apply the configuration changes, I could see in the report from
`ifconfig bse0` that the configuration had applied:

```
bse0: flags=8843<UP,BROADCAST,RUNNING,SIMPLEX,MULTICAST> mtu 1500
        lladdr dc:a6:32:d1:35:f1
        index 1 priority 0 llprio 3
        media: Ethernet autoselect (1000baseT full-duplex)
        status: active
        inet 192.168.1.1 netmask 0xffffff00 broadcast 192.168.1.255
```

Next I wanted to set up the DHCP server. I wanted to allocate addresses on the LAN in the range
`192.168.1.50` through `192.168.1.254`. This would give me some lower addresses for static
allocation (servers and what not). To achieve this I first edited the `/etc/dhcpd.conf` file as
follows:

```
subnet 192.168.1.0 netmask 255.255.255.0 {
  option domain-name-servers 192.168.1.1;
  option routers 192.168.1.1;
  range 192.168.1.50 192.168.1.254;
}
```

Then I enabled and started `dhcpd` using `rcctl`:

```
# rcctl enable dhcpd
# rcctl start dhcpd
```

I was now able to check that the devices on my LAN were able to obtain IP addresses. Some of the
devices needed to be nudged to acquire a new DHCP lease, and one or two needed to be restarted. I
think part of the reason for this was that the subnet had changed from `192.168.0.0/24` to
`192.168.1.0/24`.

## PF Configuration

### Dealing with MTU

During early testing I found that there were some problems establishing connections to a small
number of servers. I've found that this can often be a sign that there might be a problem with the
configuration of the MTU/MSS.

To fix this I added the following statement to `/etc/pf.conf`:

```
match in all scrub (no-df random-id max-mss 1452)
```

The intention of this statement is to `scrub` incoming packets on all interfaces in the following
manners:

1. Clear the _dont-fragment_ (DF) flag from matching IPv4 packets. Typically PF will drop fragmented
   packets that have this bit set unless `no-df` is set.
2. Replace the original IPv4 identification field with a random number by setting `random-id`.
3. Changing the maximum segment size (MSS) on TCP SYN packets to be no greater than 1452 bytes.

I initially set the MSS to 1460, thinking that there would be 40 bytes of headroom required in a TCP
packet: 20 bytes of IPv4 header and 20 bytes of TCP header. This did not always help, and a
colleague recommended 1452 instead, which fixed the issues I was seeing 😊. My colleague reminded me
that there would need to be an additional 8 bytes more headroom, as my Internet packets were being
encapsulated by PPPoE.

In retrospect, when I was running `ping` to find the MTU size I was being told exactly what number I
should have been using 🙄.

```
# ping -s 1472 -I eth0 -M do git.blakerain.com
PING git.blakerain.com (85.10.205.2) from 192.168.1.35 eth0: 1472(1500) bytes of data.
From 192.168.1.1 (192.168.1.1) icmp_seq=1 Frag needed and DF set (mtu = 1492)
ping: local error: message too long, mtu=1492
```

## DNS Configuration with Unbound

### Adding Custom Entries