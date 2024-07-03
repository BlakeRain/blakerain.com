---
title: Adding DNS Adblock to my Unbound Configuration
tags:
  - openbsd
  - unbound
  - raspberry-pi
date: 2024-07-03
summary: |
  In this post I share how I added DNS adblocking to the Unbound DNS server configuration on my
  OpenBSD firewall.
params:
  customHero: |
    background: linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), linear-gradient(90deg, rgba(195,63,117,1) 0%, rgba(175,58,134,1) 50%, rgba(11,13,67,1) 100%);
---

In a [previous post] I shared my experiences setting up an [OpenBSD] router that included [Unbound]
as a caching (non-authoritative) DNS server. After having run with this for a couple of weeks, I
decided that I wanted to try implementing something similar to a [PiHole] to block domains used for
ads and other nefarious content.

{{< figure src="firefox-error.png" title="Blocked domains no longer resolve, which is lovely." >}}

# Sourcing a List of Domains

Finding a list of domains to block proved to be very easy thanks to the efforts of Steven Black and
the contributors of the [consolidated host files](https://github.com/StevenBlack/hosts) on GitHub.
This repository contains a consolidated list of hosts from multiple curated sources. The repo
includes different hosts file variants based around different categories such as gambling, social,
porn, fakenews, and so on.

I picked the **Unified hosts + fakenews + gambling + social** variant which, as the name suggests,
includes the unified ads and malware domains, along with fake news, gambling, and social domains. At
time of writing, this includes 177,286 distinct domains.

The README in the repository includes a [list of downloads], with links to the README and hosts file
download for each variant. Each [hosts(5)](https://man.openbsd.org/man5/hosts.5) file is formatted
exactly as you'd expect.

```
# Title: StevenBlack/hosts
#
# This hosts file is a merged collection of hosts from reputable sources,
# with a dash of crowd sourcing via GitHub
#
# Date: 02 July 2024 03:24:15 (UTC)
# Number of unique domains: 163,646
#
# Fetch the latest version of this file: https://raw.githubusercontent.com/StevenBlack/hosts/master/hosts
# Project home page: https://github.com/StevenBlack/hosts
# Project releases: https://github.com/StevenBlack/hosts/releases
#
# ===============================================================

127.0.0.1 localhost
127.0.0.1 localhost.localdomain
127.0.0.1 local
255.255.255.255 broadcasthost
::1 localhost
::1 ip6-localhost
::1 ip6-loopback
fe80::1%lo0 localhost
ff00::0 ip6-localnet
ff00::0 ip6-mcastprefix
ff02::1 ip6-allnodes
ff02::2 ip6-allrouters
ff02::3 ip6-allhosts
0.0.0.0 0.0.0.0

# Custom host records are listed here.


# End of custom host records.
# Start StevenBlack

#=====================================
# Title: Hosts contributed by Steven Black
# http://stevenblack.com

0.0.0.0 ck.getcookiestxt.com
0.0.0.0 eu1.clevertap-prod.com
0.0.0.0 wizhumpgyros.com
0.0.0.0 coccyxwickimp.com
0.0.0.0 webmail-who-int.000webhostapp.com
0.0.0.0 010sec.com
0.0.0.0 01mspmd5yalky8.com
0.0.0.0 0byv9mgbn0.com
... 170,000+ lines ...
```

In order to use this file with Unbound, I needed to make some changes.

# Configuring Unbound

To configure Unbound, I needed to process the hosts file I got from Steven Black's repository into
something that Unbound can use. To configure Unbound to block a domain, we want to use a
`local-zone` configuration for each of the blocked domains. Each `local-zone` configuration allows
us to set the answer Unbound will reply with if there is no `local-data` matching the domain. I use
the `refuse` option, which tells Unbound to respond with the `REFUSED` response code (number 5),
which is a good response for policy decisions.

```yaml
# Block my own domain
local-zone: "blakerain.com" refuse
```

{{< callout type=tip >}}
See the [unbound documentation](https://unbound.docs.nlnetlabs.nl/en/latest/manpages/unbound.conf.html#unbound-conf-local-zone) for the supported options to the `local-zone` attribute.
{{</callout>}}

To create this configuration, I needed to convert each of the hosts mentioned in the downloaded
hosts file into a `local-zone` attribute in Unbound's configuration language. Taking a look at the
unified hosts file downloaded from the repository we can see that the blocked domains are all
associated with the host `0.0.0.0`. We can find all those lines by running the hosts file through
`grep`:

```
$ grep '^0\.0\.0\.0' hosts | head
0.0.0.0 ck.getcookiestxt.com
0.0.0.0 eu1.clevertap-prod.com
0.0.0.0 wizhumpgyros.com
0.0.0.0 coccyxwickimp.com
0.0.0.0 webmail-who-int.000webhostapp.com
0.0.0.0 010sec.com
0.0.0.0 01mspmd5yalky8.com
0.0.0.0 0byv9mgbn0.com
0.0.0.0 ns6.0pendns.org
```

For each of these lines, we can use `awk` to reformat the line into a Unbound `local-zone`
configuration:

```
$ grep '^0\.0\.0\.0' hosts | awk '{print "local-zone: \""$2"\" refuse"}' | head
local-zone: "ck.getcookiestxt.com" refuse
local-zone: "eu1.clevertap-prod.com" refuse
local-zone: "wizhumpgyros.com" refuse
local-zone: "coccyxwickimp.com" refuse
local-zone: "webmail-who-int.000webhostapp.com" refuse
local-zone: "010sec.com" refuse
local-zone: "01mspmd5yalky8.com" refuse
local-zone: "0byv9mgbn0.com" refuse
local-zone: "ns6.0pendns.org" refuse
```

I piped all these generated configuration lines into a new `adblock.conf` file alongside my current
Unbound configuration (which lives in the `/var/unbound/etc` directory). I then updated my
`unbound.conf` configuration file to include the `adblock.conf` file after my existing `local-data`
lines:

```yaml
server:
  # ...

  # Configure some local network domains
  local-data: "cyan.localdomain A 192.168.1.20"
  local-data: "blue.localdomain A 192.168.1.24"
  # ...

  # Include the adblock domains
  include: "/var/unbound/etc/adblock.conf"
```

Next I ran `unbound-checkconf` to check the configuration, and as everything was okay, restarted
unbound with `rcctl`.

```
# unbound-checkconf
unbound-checkconf: no errors in /var/unbound/etc/unbound.conf
# rcctl restart unbound
```

To check that the domain blocking works correctly, on my local machine I made a test query to
`facebook.com`. As I hoped for, the server came back with `REFUSED`.

```
$ host facebook.com
Host facebook.com not found: 5(REFUSED)
```

# Firefox and DNS over HTTPS

A few years ago, [DNS over HTTPS] was introduced with the intention of preserving privacy and
increasing security. Unfortunately, one of the disadvantages of this approach is that it frustrates
using a local DNS server. Fortunately, for now, many applications still let us change whether or not
they use DoH.

Luckily my intention was to block domains for ads in my browser, and Firefox still lets you
[configure DoH]. To make sure that Firefox makes use of my local DNS server I disabled DNS over
HTTPS in Firefox settings (found at the bottom of the _Privacy and Security_ page in Firefox
settings).

{{< figure src="firefox-dns-over-https.png" title="Disabling DNS over HTTPS in Firefox." >}}

{{< callout type=tip >}} Mozilla have a rather good [DNS over HTTPS FAQ](https://support.mozilla.org/en-US/kb/dns-over-https-doh-faqs) that is worth a look. {{</callout>}}

# Automating with Shell Scripting

Now that I knew what I needed to do, I wanted to be able to quickly update the `adblock.conf` file
with the latest download from the GitHub repository. To facilitate this, I wrote a short shell
script that downloads the hosts file from GitHub for the chosen variant and transforms the output
into the Unbound configuration.

```bash
VARIANT=${VARIANT:-fakenews-gambling-social}
URL="https://raw.githubusercontent.com/StevenBlack/hosts/master/alternates/$VARIANT/hosts"
wget -qO- "$URL" | grep '^0\.0\.0\.0' | sort | awk '{print "local-zone: \""$2"\" refuse"}'
```

Now I can update the ad blocking configuration on my gateway by piping the output of this shell
script into the `/var/unbound/etc/adblock.conf` and then restarting Unbound:

```
# sh gen-adblock.sh > /var/unbound/etc/adblock.conf
# unbound-checkconf
unbound-checkconf: no errors in /var/unbound/etc/unbound.conf
# rcctl restart unbound
unbound(ok)
unbound(ok)
```

# Adding Exceptions

The domain blocking works very nicely, however there are some domains that get mentioned in the
unified hosts file that I actually still want to access. For example, I still want to access
`engineering.fb.com`, but this has been blocked by the `local-zone facebook.com refuse`. To allow
the domain, I add a new `local-zone` statement after the inclusion of the `adblock.conf` file,
setting the type to [transparent].


```yaml
server:
  # ...

  # Configure some local network domains
  local-data: "cyan.localdomain A 192.168.1.20"
  local-data: "blue.localdomain A 192.168.1.24"
  # ...

  # Include the adblock domains
  include: "/var/unbound/etc/adblock.conf"

  # Override some local zones
  local-zone: "engineering.fb.com." transparent
```

Unfortunately this doesn't always work for well for every domain I want to unblock, especially if
the domain already exists in the `adblock.conf` file. For example, the domain `code.facebook.com` is
mentioned directly in the hosts file, and so `unbound-checkconf` issues a warning about a duplicate
zone configuration:

```
# unbound-checkconf
[...] unbound-checkconf[87279:0] warning: duplicate local-zone code.facebook.com.
```

To address this, I decided to update my `gen-adblock.sh` script to handle my exceptions to the ad
blocking. To start with I created an `adblock.exceptions` file listing the domains I want to permit,
with each domain on one line:

```
engineering.fb.com
code.facebook.com
```

I want to remove any lines in the generated `adblock.conf` file that contain any of the domains in
the `adblock.exceptions` file. To do this, I use `awk` to convert each line into a `g/re/d` command
for `ed`. This means that the line `code.facebook.com` will become `g/"code\.facebook\.com"/d`. When
passed to `ed`, this will delete any lines that match the given regular expression.

Using `ed` is quite a fun way to perform a series of edits to a file, as it can accept commands from
`stdin`:

```
(echo 'g/"code\.facebook\.com"/d'; echo w) | ed - adblock.conf
```

Here we're echoing the `g/re/d` command to delete any lines that match `"code.facebook.com"`. Notice
the additional `echo w` to tell `ed` to write the changes to the file after performing the
operations.

In summary, I changed the `gen-adblock.sh` script as follows:

1. The script now writes the `adblock.conf` file in the `/var/unbound/etc` directory.
2. The `adblock.exceptions` file is transformed into `ed` commands, and then ran against the
   `adblock.conf` file to delete any matching lines.
3. The `adblock.exceptions` file is transformed into `local-zone` statements with the `transparent`
   type, and written to the `adblock.exceptions.conf` configuration file.

The new `gen-adblock.sh` script is now as follows:

```sh
UNBOUND="/var/unbound/etc"
VARIANT=${VARIANT:-fakenews-gambling-social}
URL="https://raw.githubusercontent.com/StevenBlack/hosts/master/alternates/$VARIANT/hosts"
wget -qO- "$URL" | grep '^0\.0\.0\.0' | sort | \
  awk '{print "local-zone: \""$2"\" refuse"}' > "$UNBOUND/adblock.conf"
(cat "$HOME/adblock.exceptions" | \
  awk '{gsub(/\./,"\\."); print "g/\"" $0 "\"/d"}'; echo w) | ed - "$UNBOUND/adblock.conf"
cat "$HOME/adblock.exceptions" | \
  awk '{print "local-zone: \""$0".\" transparent"}' > "$UNBOUND/adblock.exceptions.conf"
```


Now I can update my `unbound.conf` file to include the `adblock.exceptions.conf` file instead of
overriding the local zones.

```yaml
server:
  # ...

  # Configure some local network domains
  local-data: "cyan.localdomain A 192.168.1.20"
  local-data: "blue.localdomain A 192.168.1.24"
  # ...

  # Include the adblock domains and the exceptions
  include: "/var/unbound/etc/adblock.conf"
  include: "/var/unbound/etc/adblock.exceptions.conf"
```

Now I can just run `gen-adblock.sh` to generate the new Unbound configuration, respecting my
exceptions in the `$HOME/adblock.exceptions` file. Then I can check the configuration with
`unbound-checkconf`, which no longer shows duplicate `local-zone` attributes:

```
# sh gen-adblock.sh
# unbound-checkconf
unbound-checkconf: no errors in /var/unbound/etc/unbound.conf
```

# Conclusion

Using DNS blocking has so far worked quite nicely. The blocking helps ensure I don't end up being
directed to something like `x.com`.

I have the `gen-adblock.sh` script along with my `adblock.exceptions` file in my home directory on
the Raspberry Pi. When I want to update the DNS adblocker configuration I can just run this script
and then restart Unbound.

I've included the source for the `gen-adblock.sh` script in the following Gist on GitHub.

{{< bookmark
title="Script to generate adblocking configuration for Unbound "
url="https://gist.github.com/BlakeRain/75bc52434528dcabb6ca87908d70468e"
description="Script to generate adblocking configuration for Unbound "
author="Blake Rain"
publisher="GitHub Gist"
thumbnail="https://github.githubassets.com/images/modules/gists/gist-og-image.png"
icon="https://github.githubassets.com/favicons/favicon.svg" >}}


[previous post]: /blog/raspberrypi-openbsd-firewall/
[OpenBSD]: https://www.openbsd.org/
[Unbound]: https://github.com/NLnetLabs/unbound
[PiHole]: https://pi-hole.net/
[list of downloads]: https://github.com/StevenBlack/hosts?tab=readme-ov-file#list-of-all-hosts-file-variants
[transparent]: https://unbound.docs.nlnetlabs.nl/en/latest/manpages/unbound.conf.html#unbound-conf-local-zone-type-transparent
[DNS over HTTPS]: https://en.wikipedia.org/wiki/DNS_over_HTTPS
[configure DoH]: https://support.mozilla.org/en-US/kb/dns-over-https
