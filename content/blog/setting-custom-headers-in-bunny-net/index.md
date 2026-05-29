---
title: Setting Custom Headers in Bunny CDN
date: 2026-05-28T21:33:00
tags:
  - bunny
  - cdn
  - dnssec
---

I've recently [moved this website] to [Bunny CDN] as part of an on-going effort to remove my
reliance on large tech companies, and specifically big US tech companies. I never got around to
setting up any site-specific headers, so I've been using the default headers that come from Bunny's
CDN, and now I need to add these headers back in.

I also took a moment to add the DNSSEC for the `blakerain.com` domain, which I had to remove back
when I migrated the domain to Bunny's DNS.

<!--more-->

The old site was hosted on a server I rent from [Hetzner], and was served via [Caddy]. The old
configuration for this site looked like this:

```caddy
blakerain.com {
  root * /var/www/blakerain-com
  file_server

  header * {
    Access-Control-Allow-Origin "https://blakerain.com https://pa.blakerain.com"
    Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"

    # NOTE: I added newlines here to make the header easier to read
    Content-Security-Policy "default-src 'self' https://blakerain.com https://pa.blakerain.com;
      frame-src 'self' https://bandcamp.com;
      script-src 'self' 'unsafe-inline' https://blakerain.com https://pa.blakerain.com;
      style-src 'self' 'unsafe-inline' https://blakerain.com https://pa.blakerain.com;
      img-src 'self' https://blakerain.com https://pa.blakerain.com data:;
      font-src 'self' https://blakerain.com https://pa.blakerain.com;
      connect-src 'self' https://blakerain.com https://pa.blakerain.com;
      object-src 'none';
      base-uri 'self';
      frame-ancestors 'none';
      upgrade-insecure-requests;"

    Cross-Origin-Opener-Policy "same-origin-allow-popups"
    Cross-Origin-Resource-Policy "cross-origin"

    Permissions-Policy "geolocation=(), microphone=(), camera=(), fullscreen=(self)"

    X-Content-Type-Options nosniff
    X-Frame-Options DENY
    X-XSS-Protection "0"
  }


  header /.well-known/openpgpkey/* {
    Content-Type application/octet-stream
    Access-Control-Allow-Origin *
  }

  handle_errors 404 {
    rewrite * /{err.status_code}.html
    file_server
  }

  handle_errors {
    rewrite * /{err.status_code}.html
    file_server
  }
}
```


To add all these headers, I've created a single [edge rule] that I'll apply to all requests. To make
the rule apply to all requests, I set a single _Match any_ condition that matches the _Request URL_
of `https://blakerain.com/*`, which is probably consistent with the `header *` rule in the old Caddy
configuration.

{{< figure src="set-condition-match-all.png" title="A single condition that matches all paths in the site" >}}

For each of the headers that I want to add, I've added an action to that edge rule. The action to
set a header is called _Set Response Header_, and is right at the bottom of the list of actions.

{{< figure src="select-set-response-header.png" title="The action selection in an edge rule" >}}

When _Set Response Header_ is selected, you can add in the header name and value. I'm assuming that
Bunny are going to be pretty reasonable about dealing with things like the length and formatting of
the header value. Unfortunately there's not really a lot of documentation about the individual
actions and what they can (or cannot) do, so I kinda had to YOLO it.

{{< figure src="setting-custom-header-values.png" title="Setting custom header values" >}}


Once I've added all the header values, and configured the condition, I saved the edge rule. After a
few seconds this propagated across the CDN and I was seeing the headers in my browser.

The full edge rule looks like this:

{{< figure enlarge=true src="bunny-custom-headers.png" title="Edge rule in Bunny CDN to add custom headers" >}}

# Adding DNSSEC

Since I moved the `blakerain.com` domain to Bunny's DNS, I needed to again set up DNSSEC for the
domain. Whilst Bunny are acting as the nameservers for the domain, AWS Route53 is still the
registrar. At some point I need to find a good EU registrar that I can move my domains to.

Heading over to the DNS section of the Bunny console, under the _Security_ tab for the domain, is
the option to enable DNSSEC for the domain.

{{< figure src="enable-dnssec.png" title="Enabling DNSSEC in Bunny CDN" >}}

Selecting _Enable DNSSEC_ presents a warning about propagation of DS records. I don't really care if
the site reports invalid DNSSEC for the time it takes for the DS records to propagate from Route53,
and the TTL for a `.com` domain is like 6 hours or something (according to `dig -t NS com` anyway).

{{< figure src="dnssec-warning.png" title="A warning about the propagation of DS records" >}}

Clicking the _Enable DNSSEC_ configuration presents the DS record details that need to be given to
my registrar. The only thing I really care about is the _Public Key_ value, which I need to give to
Route53.

{{< figure src="ds-records-for-registrar.png" title="DS records for the registrar" >}}

On Route53 I can add the public key from Bunny. I checked to ensure that the _Key type_ and
_Algorithm_ I selected in Route53 matched the values given in the _Flags_ and _Algorithm_ values
given by Bunny. I don't know what the _Key tag_ that Bunny gave me is for, so I made the wise choice
of ignoring it.

{{< figure src="add-dnssec-key-route53.png" title="Adding the public key from Bunny to Route53" >}}

After a short delay of a few minutes, I got confirmation from Route53 that the DNSSEC key had been
added, and it showed up in the _DNSSEC keys_ section. The bit I was interested in was making sure
that the _Digest_ matched the _Digest_ that Bunny gave me.

{{< figure src="route53-dnssec.png" title="Route53 showing the active DNSSEC key" >}}

Using `delv` I was able to verify that the DNSSEC was active and validated:

```
% delv blakerain.com
; fully validated
blakerain.com.		300	IN	A	79.127.237.132
blakerain.com.		300	IN	RRSIG	A 13 2 300 20260626093000 20260529090000 3237 blakerain.com. ...
```

This all went rather smoothly without any real surprises. I've been dabbling with Bunny's [Magic
Containers], and I need to finish the [write
up](https://git.blakerain.com/BlakeRain/blakerain.com/pulls/45) of how that's going.

[moved this website]: /blog/moving-site-to-bunny-net
[Bunny CDN]: https://bunny.net/
[Hetzner]: https://www.hetzner.com/
[Caddy]: https://caddyserver.com/
[edge rule]: https://docs.bunny.net/cdn/edge-rules
[Magic Containers]: https://docs.bunny.net/magic-containers
