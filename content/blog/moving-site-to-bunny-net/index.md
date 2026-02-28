---
title: Moving My Site to Bunny CDN
date: 2026-02-28T15:34:00
tags:
  - bunny
  - cdn
  - eu
coverImage:
  author: Tomas Balogh
  url: https://www.pexels.com/photo/brown-rabbit-in-front-of-white-daisies-1074644/
---

For the past year or so, I've been working on moving away from big US tech companies. Mostly this
has been due to an increasing desire to self-host as much as possible, and maintain as much control
and privacy as I can. I must admit that this has been exacerbated by recent events, such as the US
[threatening to invade Greenland], [imposing sanctions on the ICC], causing Microsoft to [cancel the
ICC chief prosecutor]'s email account, the problems caused by the [CLOUD act], and so on. I'm aware
that hyperscalers like Amazon Web Services are [promising] an EU sovereign cloud, but I don't trust
them.

There's also some professional reasons to look into moving away from US big tech companies: at
Cignpost we operate in a [regulated] industry, and there may end up being a lot of regulatory
compliance issues arising for EU and UK businesses that rely on US tech companies. So, I need to
make sure that I have some idea of how to move our core infrastructure to a more compliant and
secure location.

[threatening to invade Greenland]: https://www.bbc.co.uk/news/articles/c07xkeee2k3o
[imposing sanctions on the ICC]: https://www.whitehouse.gov/presidential-actions/2025/02/imposing-sanctions-on-the-international-criminal-court/
[cancel the ICC chief prosecutor]: https://apnews.com/article/icc-trump-sanctions-karim-khan-court-a4b4c02751ab84c09718b1b95cbd5db3
[CLOUD act]: https://berthub.eu/articles/posts/servers-in-de-eu-eigen-sleutels-helpt-het/
[promising]: https://press.aboutamazon.com/2023/10/amazon-web-services-to-launch-aws-european-sovereign-cloud
[regulated]: https://handbook.fca.org.uk/glossary/G218

# Bunny CDN

I've been keeping an eye on Bunny for a while now, after learning about their CDN them a few years
ago. The Bunny CDN network covers [77 countries] over six continents, and they've been adding quite
a lot of features to their network. A few that I've wanted to test are:

- [Magic containers], which allows you to deploy containers to the Bunny network.
- [Edge scripting], which runs Deno on the edge. I'd have preferred to be able to deploy
  WebAssembly directly, but I guess I can use JavaScript to load a WebAssembly module.
- The more recent [Bunny Database], which uses [libSQL] from [Turso] to provide an SQLite-like
  database.

Before I start experimenting with these features, I want to first make sure that I can do two
things:

1. Manage a domain using Bunny's DNS service, and
2. Work with the CDN to serve a static website.

But before I begin, let me share a little of how things stood as of Friday night.

[77 countries]: https://bunny.net/network/
[Magic containers]: https://bunny.net/magic-containers/
[Edge scripting]: https://bunny.net/edge-scripting/
[Bunny Database]: https://bunny.net/database/
[libSQL]:https://github.com/tursodatabase/libsql
[Turso]: https://turso.tech/

# The ~Current~ Previous Situation

Before I moved this site to Bunny, I mostly hosted everything on either servers that I rent from
[Hetzner] or, for personal things like [Readeck], at home on a Dell PowerEdge server. A couple of
things are still left on an old [Linode] VPS that I've had since 2011.

I've been using [Hetzner] for a couple of years now, and I've found them to be very good and
reliable. I also use their [StorageBox] as one of the destinations for all my backups. This site
([blakerain.com]), along with several other services, are all hosted on the Hetzner server, and
served via [Caddy]. I've listed some of the services I run on my [hosting] slash-page.

The Linode server is still running, but since they [sold to Akamai] in 2022 I've been ushering
services away from it and onto Hetzner servers. I wasn't kinda heartbroken about this or anything.

The servers at home run personal services like [Readeck] along with a few [other services], and I
access all that over a [Nebula] VPN.

All my DNS is done by [AWS Route53], which also serves as my registrar.

[Hetzner]: https://www.hetzner.com/
[StorageBox]: https://www.hetzner.com/storage/storage-box/
[blakerain.com]: https://blakerain.com/
[Caddy]: https://caddyserver.com/
[sold to Akami]: https://www.akamai.com/newsroom/press-release/akamai-to-acquire-linode
[Readeck]: https://readeck.org/en/
[hosting]: /hosting/
[other services]: /uses/
[Nebula]: https://github.com/slackhq/nebula
[AWS Route53]: https://aws.amazon.com/route53/

# Moving to Bunny

To move this site to Bunny's CDN, I needed to make the following changes:

1. Change the DNS nameservers for `blakerain.com` from Route53 to Bunny's nameservers.
1. Change the [Terraform] templates to use Bunny's DNS service for creating the DNS records for each
   service under `blakerain.com`.
1. Set up the [Bunny Storage] zone for the `blakerain.com` website.
1. Create a CDN zone for the `blakerain.com` website backed by the storage zone.
1. Alter the [deployment script] to use SFTP to upload the site to the storage zone and issue a
   cache purge.

[Terraform]: https://www.terraform.io/
[Bunny Storage]: https://bunny.net/storage/
[deployment script]: https://git.blakerain.com/BlakeRain/blakerain.com/src/branch/main/.forgejo/workflows/deploy.yaml

## Migrating DNS

To change the DNS nameservers for `blakerain.com` from Route53 to Bunny's nameservers, I first
created the DNS zone for `blakerain.com` on Bunny's DNS service. This gives me the nameservers that
I need to provide to my registrar.

{{< figure src="bunny-dns-nameservers.png" title="Bunny's nameservers have very cute names" >}}

Back in the Route53 part of the AWS console I can remove the nameservers that Route53 placed there
when I transferred the domain to AWS with the new nameservers from Bunny. AWS gives me the usual
spiel about how this could take 24 hours to take effect, but it really only took about 10 minutes.

{{< figure src="route53-set-nameservers.png" title="Setting the nameservers in Route53" >}}

While the nameservers are changing over, I wanted to copy over all the DNS records from Route53 to
Bunny. Unfortunately, there's no easy export feature in Route53 to export all the records from a
hosted zone.

I used the `aws` CLI to export the salient properties from each record in the hosted zone and format
the result as CSV:

```bash
aws route53 list-resource-record-sets \
  --hosted-zone-id "/hostedzone/<hosted-zone-ID>" \
  | jq -r '.ResourceRecordSets[]
           | [.Name, .Type, (.ResourceRecords[]? | .Value), .TTL, .AliasTarget.DNSName?]
           | @csv'
```

I then used the following Python script to convert the CSV into something resembling a [bind]
configuration file:

```python
#!/usr/bin/env python3
import csv, sys

with open(sys.argv[1]) as f:
    for row in csv.reader(f):
        if not row or not row[0].strip():
            continue

        name, rtype, value, ttl = row[0], row[1], row[2], row[3]

        if rtype == 'MX':
            pri, target = value.split(None, 1)
            if not target.endswith('.'):
                target += '.'
            value = f"{pri} {target}"
        elif rtype in ('CNAME', 'NS'):
            if not value.endswith('.'):
                value += '.'
        elif rtype == 'TXT':
            # After CSV parsing, Route53 gives us e.g. "v=spf1 ..." with
            # literal quotes. Multi-string TXT (DKIM) has "" between chunks.
            # BIND wants: "chunk1" "chunk2"
            value = value.replace('""', '" "')

        print(f"{name}\t{ttl}\tIN\t{rtype}\t{value}")
````

This gave me some output that looks like this, which I could then import into Bunny's DNS service.

```
blakerain.com.	300	IN	A	85.10.205.2
blakerain.com.	300	IN	MX	10 hz1.blacktreenetworks.com.
blakerain.com.	300	IN	TXT	"v=spf1 ip4:85.10.205.2 ~all"`
```

{{< figure src="bunny-dns-import-zone.png" title="Importing the DNS records into Bunny" >}}

Once the DNS records were imported, and the nameserver changeover had propagated, I was able to see
from repeated invocations of `dig` that the DNS records were all present and correct.

## Setting up the Storage Zone

Setting up the storage zone in Bunny was very simple. For the storage tier I chose _Standard_, which
is the cost-effective option for a small website, priced at $0.01/GB per storage region for up to
two regions, $0.005/GB per additional region, up to a total of 9 regions.

{{< figure src="bunny-storage-tiers.png" title="Selection of storage tier for a storage zone" >}}

For the main storage region I selected _London (UK)_ with replication in _Frankfurt (DE)_ and _New
York (US)_. This gives me a total of three regions. This gives a total monthly storage cost of
$0.025/GB. Given that the this website it 45.26 MB, I think this will be affordable.

{{< figure src="bunny-storage-regions.png" title="Selection of storage regions for a storage zone" >}}

With the storage regions selected, I was then able to upload the website content to the storage
zone. To connect to the storage zone, I used SFTP. The credentials for the SFTP connection are given
in the _FTP and API Access_ section of the storage zone administration.

{{< figure src="bunny-storage-access.png" title="FTP and API Access for the storage zone" >}}

Another setting I changed was the _404 File Path_. This is found under the _Error handling_ section
in the administration of the storage zone. There I set the _404 File Path_ to `/404.html`, which is
this sites [404 page].

{{< figure src="bunny-storage-error-pages.png" title="Setting the 404 file path for the storage zone" >}}

[bind]: https://en.wikipedia.org/wiki/BIND
[404 page]: https://blakerain.com/404.html

## Setting up the CDN

Next I needed to set up the CDN, which would handle the delivery of the website content stored in
the Storage Zone. For the _Origin Type_ I chose _Storage Zone_, and selected the storage zone I
created above. I selected the _standard Tier_, which charges at $10/TB.

{{< figure src="bunny-cdn-origin.png" title="Origin Type for the CDN" >}}

For the CDN _Pricing Zones_, I selected _Europe_ and _North America_, which is consistent with the
two main sources of traffic to this site (I guess all the bots run in the US and Europe). The
billing for these regions is $0.01/GB per month.

{{< figure src="bunny-cdn-pricing-zone.png" title="Pricing Zones for the CDN" >}}

