---
title: Moving My Site to Bunny CDN
date: 2026-02-28T23:30:00
tags:
  - bunny
  - cdn
  - eu
coverImage:
  author: Tomas Balogh
  url: https://www.pexels.com/photo/brown-rabbit-in-front-of-white-daisies-1074644/
numberedHeadings: true
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

{{% toc %}}

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

# The Previous Situation

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

{{< figure src="bunny-dns-nameservers.png" caption="Bunny's nameservers have very cute names" >}}

Back in the Route53 part of the AWS console I can remove the nameservers that Route53 placed there
when I transferred the domain to AWS with the new nameservers from Bunny. AWS gives me the usual
spiel about how this could take 24 hours to take effect, but it really only took about 10 minutes.

{{< figure src="route53-set-nameservers.png" caption="Setting the nameservers in Route53" >}}

While the nameservers are changing over, I wanted to copy over all the DNS records from Route53 to
Bunny. Unfortunately, there's no easy export feature in Route53 to export all the records from a
hosted zone.

> [!NOTE]
> The reason for importing them all at once will become clear later on.

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

{{< figure src="bunny-dns-import-zone.png" caption="Importing the DNS records into Bunny" >}}

Once the DNS records were imported, and the nameserver changeover had propagated, I was able to see
from repeated invocations of `dig` that the DNS records were all present and correct.

### Updating Caddy

I have a few installations of [Caddy] running that need to be able to create DNS records for
provisioning TLS certificates via the [DNS challenge]. When using AWS Route53, I typically build the
Caddy image using the [xcaddy] tool to include the [caddy-dns/route53] plugin.

```Dockerfile
FROM caddy:builder AS builder

RUN xcaddy build \
    --with github.com/caddy-dns/route53@v1.6.0

FROM caddy:latest

COPY --from=builder /usr/bin/caddy /usr/bin/caddy
COPY Caddyfile /etc/caddy/Caddyfile
```

Now that I'm moving to Bunny DNS, for Caddy configurations that need to create DNS records I need to
change the `Dockerfile` to use the [caddy-dns/bunny] plugin instead of the [caddy-dns/route53]
plugin.

```Dockerfile
FROM caddy:builder AS builder

RUN xcaddy build \
    --with github.com/caddy-dns/bunny@v1.2.0  # <-- change here

FROM caddy:latest

COPY --from=builder /usr/bin/caddy /usr/bin/caddy
COPY Caddyfile /etc/caddy/Caddyfile
```

In addition to the changes to the Caddy container image, I also need to make changes to the
`Caddyfile` to use the `bunny` plugin instead of the `route53` plugin. Currently the entries in the
`Caddyfile` look like this:

```Caddyfile
freshrss.blakerain.com {
  tls {
    dns route53
  }

  reverse_proxy localhost:{$RSS_EXTERNAL_PORT}
}
```

I need to change this to use the `bunny` plugin instead of the `route53` plugin. I also need to
specify the API key for the Bunny provider in the `dns` directive. I include the Bunny API key in
the environment variable `BUNNY_API_KEY`, which is included in the container provisioning by
Terraform.

```Caddyfile
freshrss.blakerain.com {
  tls {
    dns bunny {env.BUNNY_API_KEY}
  }

  reverse_proxy localhost:{$RSS_EXTERNAL_PORT}
}
```

With these changes, Caddy should now be able to create DNS records for the various subdomains of the
`blakerain.com` domain as part of the TLS certificate challenge.

[DNS challenge]: https://caddyserver.com/docs/automatic-https#dns-challenge
[xcaddy]: https://caddyserver.com/docs/build#xcaddy
[caddy-dns/route53]: https://github.com/caddy-dns/route53
[caddy-dns/bunny]: https://github.com/caddy-dns/bunny

### Updating Terraform

I use [Terraform] to manage most of my infrastructure, and much of the configuration requires
creation of DNS records. This previously used the [AWS provider] from Hashicorp themselves to
interact with AWS Route53. However, I've now moved the `blakerain.com` domain to Bunny's DNS
service, so I need to update the Terraform templates to make use of the [Bunny provider].

Configuring the provider is very straightforward: adding a reference to `BunnyWay/bunnynet` in the
`required_providers` section of each Terraform module, and then adding the `bunnynet` provider at
the top-level module.

```hcl
terraform {
  required_providers {
    bunnynet = {
      source = "BunnyWay/bunnynet"
    }
  }
}

provider "bunnynet" {
  api_key = var.bunny_api_key
}
```

I provide the API key to the Bunny provider in a variable named `bunny_api_key`, which I populate
from the Terraform secrets file.

> [!WARNING] Bunny has only one API key per account?
> Strangely, it appears Bunny's API keys seem to be tied to each account, rather than allowing an
> account to have as many API keys as required. Nor does there appear to be a way to limit the
> actions that can be taken by an API key.
>
> I can see that Bunny supports [team members], but it doesn't appear that these team members have
> particularly granular permissions or separate API keys.
>
> This might be a problem.

I then replaced all uses of the `aws_route53_record` resource against the `blakerain.com` domain
with `bunnynet_dns_record` resources in the Terraform modules. There are some differences between
the two resources that I needed to be careful about. The documentation for the `bunnynet_dns_record`
resource is fairly clear, but also rather sparse -- a common problem with the Bunny documentation.

For the most part, the transformation is straightforward. For example, I have an `A` record
`freshrss.blakerain.com` that points to the Nebula VPN address of a server at home. On Route53, the
Terraform resource looked like this:

```hcl
resource "aws_route53_record" "freshrss" {
  zone_id = var.route53_zone_id
  name    = "freshrss.blakerain.com"
  type    = "A"
  ttl     = 300
  records = [var.nebula_ip]
}
```

The equivalent `bunnynet_dns_record` resource looks like this:

```hcl
resource "bunnynet_dns_record" "freshrss" {
  zone         = var.bunny_zone
  name         = "freshrss"
  type         = "A"
  value        = var.nebula_ip
  ttl          = 300
  monitor_type = "Ping"
  latency_zone = "DE"
}
```

Notice first that the `name` property does not include the domain name itself. To signal the apex of
the domain, the `name` property is set to the empty string. An example of this would be the `MX`
record for the `blakerain.com` domain:

```hcl
resource "bunnynet_dns_record" "mx_blakerain" {
  zone         = var.bunny_blakerain_dns_zone
  name         = ""
  type         = "MX"
  priority     = 10
  value        = "hz1.blacktreenetworks.com"
  ttl          = 300
  latency_zone = "DE"
}
```

Notice that, rather than writing `10 hz1.blakctreenetworks.com` for the DNS record value, we just
write the value of `hz1.blacktreenetworks.com` and pass the priority in the `priority` property.

Also notice the extra `latency_zone` and `monitor_type` properties. I get these values from the
[bunnynet_dns_record documentation], and check the settings against the values that were assumed by
Bunny after I imported the DNS records from Route53.

When it came to the DKIM record, I had to make a small change. The Route53 record used the
`replace()` function to split the DKIM record into chunks of 255 characters, in compliance with RFC
1035.

```hcl
resource "aws_route53_record" "dkim_keys_br" {
  zone_id = var.route53_blakerain_zone_id
  name    = "hz1._domainkey.blakerain.com"
  type    = "TXT"
  ttl     = 300
  records = [
    replace(base64decode(data.external.dkim_output.result["blakerain.com"]), "/(.{255})/", "$1\"\"")
  ]
}
```

However, if I look at the imported DKIM record in Bunny DNS, I can see that there is no break
in the record. Checking with [mxtoolbox.com] shows that the DKIM record is valid, and the session
transcript appears reasonable.

```plain {class="text-wrap aggressive"}
- - - dkim:hz1._domainkey.blakerain.com

 1 h.gtld-servers.net 192.54.112.30 NON-AUTH 15 ms Received 2 Referrals , rcode=NO_ERROR  blakerain.com. 172800 IN NS kiki.bunny.net,blakerain.com. 172800 IN NS coco.bunny.net,
 2 kiki.bunny.net 91.200.176.1 AUTH 0 ms Received 1 Answers , rcode=NO_ERROR  hz1._domainkey.blakerain.com. 300 IN TXT v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAj0TLrvVjGg2mok6czMZ39G3heZCoX93cJwhSE8I9h9sMmdQ+QMIZI+pMl9jnCfJH5ZCy7qO3vPszyUczId+NABmwTUVU8+LkTAxMYYAktKWkyHLjQdb/uso4BjmvV8BHp6Mh41yHk9yEemKQcLIe5twr5xI97Wn11crIBSLEmSzftl+aIg5KbHUr5eb8MRz8oVzsO2LYrvjKp+MvZ0UXITkYou+ok7frcIxrWc4I7Nc14XK9GyPPckywjCm6M+v2TtrTH8FG4W0h2aXvq482ZQjotCEuQpjYxhkd0d75Q4kjgfPmUS6IJaaItU7D0wL9XNSMU1uJrR75KPvLqeR6aQIDAQAB,
Record returned is a RFC 6376 TXT record.

- LookupServer [dkim:blakerain.com:hz1] 31ms
```

Indeed, my good buddy `dig` shows that the DKIM record is actually split into two parts. I've
aggressively wrapped this output to reduce horizontal scrolling, so you can see the break in the
value at: `8MRz8o" "VzsO2L`.

```plain {class="text-wrap aggressive"}
blake@black ~ % dig @91.200.176.1 TXT hz1._domainkey.blakerain.com

; <<>> DiG 9.20.19 <<>> @91.200.176.1 TXT hz1._domainkey.blakerain.com
; (1 server found)
;; global options: +cmd
;; Got answer:
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 30659
;; flags: qr aa; QUERY: 1, ANSWER: 1, AUTHORITY: 0, ADDITIONAL: 1

;; OPT PSEUDOSECTION:
; EDNS: version: 0, flags:; udp: 4096
;; QUESTION SECTION:
;hz1._domainkey.blakerain.com.	IN	TXT

;; ANSWER SECTION:
hz1._domainkey.blakerain.com. 300 IN	TXT	"v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAj0TLrvVjGg2mok6czMZ39G3heZCoX93cJwhSE8I9h9sMmdQ+QMIZI+pMl9jnCfJH5ZCy7qO3vPszyUczId+NABmwTUVU8+LkTAxMYYAktKWkyHLjQdb/uso4BjmvV8BHp6Mh41yHk9yEemKQcLIe5twr5xI97Wn11crIBSLEmSzftl+aIg5KbHUr5eb8MRz8o" "VzsO2LYrvjKp+MvZ0UXITkYou+ok7frcIxrWc4I7Nc14XK9GyPPckywjCm6M+v2TtrTH8FG4W0h2aXvq482ZQjotCEuQpjYxhkd0d75Q4kjgfPmUS6IJaaItU7D0wL9XNSMU1uJrR75KPvLqeR6aQIDAQAB"

;; Query time: 11 msec
;; SERVER: 91.200.176.1#53(91.200.176.1) (UDP)
;; WHEN: Sat Feb 28 21:17:33 GMT 2026
;; MSG SIZE  rcvd: 481
```

This makes me believe that I can safely remove the length split from the Terraform resource, and
that I can rely on the record still being valid. Unfortunately there is no mention of the length
requirement for a DNS record in the Bunny documentation.

> [!WARNING] The Bunny Documentation is Pretty Sparse
> I don't expect Bunny to compete with a multi-billion dollar corporation, but the documentation for
> Bunny is quite sparse, and often missing small details that would be pretty important.
>
> As an example, consider the Bunny documentation for [DNS records] and the AWS documentation for
> just the [TXT record type]. The AWS documentation (which is endless), goes into exquisite detail
> about exactly what characters are allowed in a TXT record, how to split the length on a 255
> character boundary, what the _actual_ length limit is (4,000 characters), and so on.

To keep the resource that Terraform is generating consistent with what Bunny is showing me, I'll
change the DKIM resource in the Terraform module to include the entire DKIM record value, without
splitting it into chunks.

```hcl
resource "bunnynet_dns_record" "dkim_keys_br" {
  zone         = var.bunny_blakerain_dns_zone
  name         = "hz1._domainkey"
  type         = "TXT"
  value        = base64decode(data.external.dkim_output.result["blakerain.com"])
  ttl          = 300
  latency_zone = "DE"
}
```

[AWS provider]: https://registry.terraform.io/providers/hashicorp/aws/latest/docs
[Bunny provider]: https://registry.terraform.io/providers/BunnyWay/bunnynet/latest
[team members]: https://docs.bunny.net/account/team-management
[bunnynet_dns_record documentation]: https://registry.terraform.io/providers/BunnyWay/bunnynet/latest/docs/resources/dns_record
[mxtoolbox.com]: https://mxtoolbox.com/
[one place]: https://support.bunny.net/hc/en-us/articles/12816389845404-How-to-set-up-a-domain-and-DNS-records-in-DNS#4
[TXT record type]: https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/ResourceRecordTypes.html#TXTFormat
[DNS records]: https://docs.bunny.net/dns/records

### Importing Resources into Terraform

Recall that I imported the DNS records from Route53 into Bunny while waiting for the nameservers to
change over. I have also defined `bunnynet_dns_record` resources in the various Terraform modules
for my infrastructure. I now need to _import_ the existing DNS records into the Terraform state.

To import the existing DNS records into the Terraform state, I can use the `terraform import`
command. The first argument to the command is the resource path, and the second argument is the
provider-dependent resource ID. For Bunny DNS records, the resource ID is the ID of the DNS zone and
the ID of the DNS record, separated by a pipe character (`|`):

```
terraform import module.freshrss.bunnynet_dns_record.freshrss "123456|987654"
```

To find the IDs of the DNS zone and the DNS record, I had to use the API. The ID of the DNS zone is
available in the UI.

{{< figure src="bunny-dns-zone-id.png" caption="Finding the ID of the DNS zone" >}}

The ID of the DNS records is not shown in the UI, so I had to use the API to find them. Using the
[Get DNS Zone] API endpoint. The path for the API endpoint is `/dnszone/{zoneId}`. The response is a
JSON object with a `Records` property, being an array of objects, one for each of the DNS records.
Each DNS record object has an `Id` property. It is the value of this `Id` that I need to use in the
`terraform import` command. I used a bit of bash-fu to extract all the IDs and build the `terraform
import` commands.

```bash
curl -v -H "AccessKey: $BUNNY_API_KEY" https://api.bunny.net/dnszone/123456 | \
   jq -r '.Records[] | [.Name, .Id] | @tsv' | \
   awk '{ print "terraform import module." $1 ".bunnynet_dns_record." $1 " \"123456|" $2 "\"" }'
```

This gives me a list of commands that I can then pick from and run to import the existing DNS
records into the Terraform state.

```
terraform import module.forgejo.bunnynet_dns_record.forgejo "123456|987654"
module.forgejo.bunnynet_dns_record.forgejo: Importing from ID "123456|987654"...
module.forgejo.bunnynet_dns_record.forgejo: Import prepared!
  Prepared bunnynet_dns_record for import
module.forgejo.bunnynet_dns_record.forgejo: Refreshing state... [name=git]
module.mail.module.spam.data.external.dkim_output: Reading...
module.mail.module.spam.data.external.dkim_output: Read complete after 6s [id=-]

Import successful!

The resources that were imported are shown above. These resources are now in
your Terraform state and will henceforth be managed by Terraform.`
```

With the Terraform state now set up, I can run `terraform apply` to apply the changes. As all the
resources were equivalent to what I had imported from Bunny DNS, the only changes made by Terraform
were the removal of the unused Route53 DNS records for the `blakerain.com` domain.

With the Terraform now sorted out, I can move on to setting up the storage zone and CDN for the
website.

[Get DNS Zone]: https://docs.bunny.net/api-reference/core/dns-zone/get-dns-zone

## Setting up the Storage Zone

Setting up the storage zone in Bunny was very simple. For the storage tier I chose _Standard_, which
is the cost-effective option for a small website, priced at $0.01/GB per storage region for up to
two regions, $0.005/GB per additional region, up to a total of 9 regions.

{{< figure src="bunny-storage-tiers.png" caption="Selection of storage tier for a storage zone" >}}

For the main storage region I selected _London (UK)_ with replication in _Frankfurt (DE)_ and _New
York (US)_. This gives me a total of three regions. This gives a total monthly storage cost of
$0.025/GB. Given that the this website it 45.26 MB, I think this will be affordable.

{{< figure src="bunny-storage-regions.png" caption="Selection of storage regions for a storage zone" >}}

With the storage regions selected, I was then able to upload the website content to the storage
zone. To connect to the storage zone, I used SFTP. The credentials for the SFTP connection are given
in the _FTP and API Access_ section of the storage zone administration.

{{< figure src="bunny-storage-access.png" caption="FTP and API Access for the storage zone" >}}

Another setting I changed was the _404 File Path_. This is found under the _Error handling_ section
in the administration of the storage zone. There I set the _404 File Path_ to `/404.html`, which is
this sites [404 page].

{{< figure src="bunny-storage-error-pages.png" caption="Setting the 404 file path for the storage zone" >}}

[bind]: https://en.wikipedia.org/wiki/BIND
[404 page]: https://blakerain.com/404.html

## Setting up the CDN

Next I needed to set up the CDN, which would handle the delivery of the website content stored in
the Storage Zone. For the _Origin Type_ I chose _Storage Zone_, and selected the storage zone I
created above. I selected the _standard Tier_, which charges at $10/TB.

{{< figure src="bunny-cdn-origin.png" caption="Origin Type for the CDN" >}}

For the CDN _Pricing Zones_, I selected _Europe_ and _North America_, which is consistent with the
two main sources of traffic to this site (I guess all the bots run in the US and Europe). The
billing for these regions is $0.01/GB per month.

{{< figure src="bunny-cdn-pricing-zone.png" caption="Pricing Zones for the CDN" >}}

Next I added a custom hostname for the `blakerain.com` domain. Entering `blakerain.com` into the
_Add custom hostname_ box in the _hostnames_ section of the CDN admin page gives me the following
feedback (note I used `test.blakerain.com` here, as I'd already added `blakerain.com`):

{{< figure src="bunny-cdn-add-domain.png" caption="Adding a custom hostname for the CDN" >}}

You can see here that I needed to add a `CNAME` record pointing to `blakerain-com.b-cdn.net`, which
is the first hostname given to the CDN zone by Bunny. "Hopping" over to the _DNS_ settings for
`blakerain.com` I added a new `CNAME` record as requested, leaving the _Hostname_ field blank for
the apex of the domain:

{{< figure src="bunny-dns-setup-apex-cname.png" height=813 enlarge=true caption="Adding a CNAME record for the apex of the domain" >}}

> [!INFO]
> Back in my day, we couldn't use CNAME records for the domain apex, as per [RFC 1537], which
> celebrated it's 30th birthday in February. These days the kids are ignoring RFCs and [doing
> whatever they want], where "whatever they want" means flattening the CNAME records into an A
> record.
>
> This is a silly feature, and custom behaviour that should not be encouraged. But it's also really
> convenient, so I'm going to try and fit in with the kids.

With the DNS record in place, I returned to the CDN admin page and clicked _Verify and Activate
SSL_. After a brief pause, Bunny confirmed that the certificate was now in place, and I could see
that `blakerain.com` was now listed as a hostname for the CDN zone, and was displayed in the
top-right as the main public address for the zone.

{{< figure src="bunny-cdn-hostname.png" caption="The `blakerain.com` hostname is now listed for the CDN zone" >}}

I also activated the _Force SSL_ option for the `blakerain.com` hostname (shown above), which causes
the CDN to redirect HTTP to HTTPS.

As a final step, I wanted to make sure that any requests to `blakerain-com.b-cdn.net` were
redirected to `blakerain.com`. I did this by adding an _Edge Rule_ to the CDN. The edge rule simply
redirects to `https://blakerain.com/{{path}}`, on any request where the URL matches the pattern
`*://blakerain-com.b-cdn.net/*`.

{{< figure src="bunny-cdn-edge-rule.png" caption="The edge rule to redirect to the new hostname" >}}

To figure this out, I just followed the instructions in the [How to redirect your b-cdn.net]
documentation from Bunny to set this up.

[RFC 1537]: https://datatracker.ietf.org/doc/html/rfc1537
[doing whatever they want]: https://blog.cloudflare.com/introducing-cname-flattening-rfc-compliant-cnames-at-a-domains-root/
[How to redirect your b-cdn.net]: https://support.bunny.net/hc/en-us/articles/360001575992-How-to-redirect-your-b-cdn-net-hostname-to-your-custom-CDN-hostname-using-edge-rules

# Site Deployment

When I'm ready to deploy a change to this site, I push a new git tag that starts with `v`. I use
this to version the site. This version tag is included in the site build, which I can check by going
to the [copyright page], where the site version is displayed:

{{< figure src="site-version.png" caption="The site version is displayed on the copyright page" >}}

When I push the new tag to Forgejo, it triggers the [deployment workflow], which sets up Node and
Go, installs the dependencies, builds the site, and deploys it. Prior to moving this site to Bunny
CDN, the deployment workflow used `rsync` to a `blakerain-com` user on the server. Caddy served from
the `~/www` directory for this user.

> [!INFO]
> To make sure that the `rsync` was reasonably secure, I used key-based authentication with an SSH
> key that was stored in a Forgejo action secret. Then I configured the `/etc/ssh/authorized_keys`
> entry corresponding to that key to limit the access:
>
> ```plain {class="text-wrap"}
> from="192.168.204.0/24",no-agent-forwarding,no-port-forwarding,no-pty,no-X11-fowrarding,command="/user/bin/rrsync ~/www/" ssh-ed25519 AAAAC3.... worker@git.blakerain.com
> ```
>
> This limits the access to the server-side component of `rsync` (called `rrsync`), limits the IP
> address to the IP address of the Forgejo action runner, limits all the SSH options, and finally
> chroots rsync to the `~/www` directory.
>
> Pretty fun stuff 😀

Now that the deployment workflow needs to send the built site to Bunny CDN, I can drop all the
`rsync` stuff and use `lftp` to upload the site to the storage zone and then issue a cache purge.
First I use `lftp` to connect to the storage zone using the SFTP credentials we saw earlier.

```yaml
jobs:
  deploy-site:
    steps:
      - name: Checkout the Repository
      - name: Setup Node
      - name: Install node dependencies
      - name: Setup Go
      - name: Setup Hugo
      - name: Build the site

      - name: Deploy the site
        env:
          BUNNY_STORAGE_HOST: ${{ secrets.BUNNY_STORAGE_HOST }}
          BUNNY_STORAGE_USERNAME: ${{ secrets.BUNNY_STORAGE_USERNAME }}
          BUNNY_STORAGE_PASSWORD: ${{ secrets.BUNNY_STORAGE_PASSWORD }}
        run: |
          apt-get update -y
          apt-get install -y lftp
          lftp -u "${BUNNY_STORAGE_USERNAME},${BUNNY_STORAGE_PASSWORD}" \
            "sftp://${BUNNY_STORAGE_HOST}" \
            -e "set sftp:auto-confirm yes; mirror -R --delete --verbose public/ /; quit"
```

Once the site is uploaded to the storage zone, I can then use `curl` to issue a [cache purge] for
the CDN pull zone using the [`purgeCache`] API endpoint.

```yaml
jobs:
  deploy-site:
    steps:
      - name: Checkout the Repository
      - name: Setup Node
      - name: Install node dependencies
      - name: Setup Go
      - name: Setup Hugo
      - name: Build the site
      - name: Deploy the site

      - name: Purge CDN cache
        run: |
          curl -sf -X POST \
            "https://api.bunny.net/pullzone/${{ secrets.BUNNY_PULLZONE_ID }}/purgeCache" \
            -H "AccessKey: ${{ secrets.BUNNY_API_KEY }}" \
            -H "Content-Length: 0"
```

With the changes to the deployment workflow in place, I created and pushed a new tag: [v2.14.3]. This
was built and, _somehow_ [deployed] perfectly without any issues.

{{< figure src="site-deployment-success.png" caption="Successful deployment of `v2.14.3`" >}}

With the site deployed successfully, and seemingly all the Terraform and other infrastructure all
set up correctly, I was able to finally go to bed.

[copyright page]: https://blakerain.com/copyright
[deployment workflow]: https://git.blakerain.com/BlakeRain/blakerain.com/src/branch/main/.forgejo/workflows/deploy.yaml
[cache purge]: https://docs.bunny.net/cdn/purge-cache
[`purgeCache`]: https://docs.bunny.net/api-reference/core/pull-zone/purge-cache
[v2.14.3]: https://git.blakerain.com/BlakeRain/blakerain.com/src/tag/v2.14.3
[deployed]: https://git.blakerain.com/BlakeRain/blakerain.com/actions/runs/150

# Final Thoughts

I have two key takeaways from the process of moving my DNS and deploying this site to Bunny CDN:

1. The CDN works very well, and so far seems stable. The API is reasonable, and the DNS works well.
   The Terraform provider appears to be solid for the parts that I've used so far (ominous
   rumbling).
2. The documentation from Bunny is not good. I know that documentation is hard, and very time
   consuming, but I really think Bunny need to sort this out. There's just too much left to
   guess-work.

Bunny, if you ever read this, I think you're doing a _truly fantastic_ job. I think that adding
things like Magic Containers, Edge Functions, and Bunny Database to the mix are great decisions, and
likely key drivers in promoting commercial use of Bunny.

Could I recommend Bunny professionally? Yes-ish... I'm most of the way towards a positive
recommendation, but the lack of detail in the documentation is such a big issue. I've heard that
Bunny's customer service is quite good, but I've not paid for any support yet to be able to test it.
I'm getting to that point though (more ominous rumbling sounds).

# Next Steps

Of course, after successfully migrating this site to Bunny's lovely CDN, I didn't actually go
straight to bed like a should. After all, a modicum of success is only encouragement for further
experimentation! So, my next step was to stay up far too late to try and make use of Bunny's [Magic
Containers] and [Bunny Database] offerings, and I had the perfect ~victim~ candidate for a very
simple app that I could deploy without feeling any remorse if I ruined it.

So I changed my super-simple pastebin app [cement] over to use Bunny's Database (libSQL) and
deployed it in their container orchestration using Terraform. You can access this app at
[paste.blakerain.com].

Of course, I found out some more things about Bunny along the way. Most of them were small bumps
along the way, until I crashed and burned and could go no further... 😮 But that will have to wait for
another post.

[cement]: https://git.blakerain.com/BlakeRain/cement
[paste.blakerain.com]: https://paste.blakerain.com/
