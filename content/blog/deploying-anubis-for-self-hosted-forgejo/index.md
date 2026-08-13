---
title: Deploying Anubis for my Self-Hosted Forgejo
date: 2026-08-13T17:54:00
tags:
  - anubis
  - forgejo
  - self-hosting
---

I've been self-hosting my own [Forgejo](https://forgejo.org/) instance for a while now. It all
started with self-hosting a [Gitea](https://about.gitea.com/) that I ran on the server in my home
network, which eventually grew in size, and eventually had to be moved to a dedicated server. I
switched this over from Gitea to Forgejo in August last year.

Everything has been going more-or-less quite well, apart from the fact that the backups for Forgejo
have been getting excessive. During a recent audit of my backups, I found that one backup process
was taking up to 20 minutes to complete. Checking the logs I found that it was spending a lot of
time processing changes to the storage of a number of containers, the most surprising of which was
my Forgejo instance.

This was surprising, as it's mostly just me on this instance, and a few mirrors that update
infrequently. My first instinct was that the culprit was my _mirrors_ organisation: a private
organisation on my Forgejo instance where I have a number of [repository mirrors], which pull from
existing FOSS repositories on GitHub. This mostly exists so I have a closer-to-home snapshot of a
repository, and don't have to deal with GitHub's tiresome rate-limiting and downtime.

After a bit of digging I found that, rather than the `mirrors` organisation being the culprit, 60
GB of the 98 GB of storage used by the Forgejo instance was in the `/gitea/repo-archive` directory.

In the configuration for Forgejo, I had the `cron.archive_cleanup` task active and running at
midnight. [This task] cleans up the repository archives that are older than a given amount of time,
which currently defaults to 24 hours. According to the administration interface, this task had run
recently (in the past 10 hours):

{{< figure src="forgejo-archive-cleanup-task.png" title="The archive clean-up task record in the Forgejo administration interface" >}}

Surely that wasn't so much activity on my Forgejo instance that there was nearly 60 GB of archives
created in the last 24 hours? I ran the _Delete all repositories' archives_ maintenance operation,
and checked to make sure that it had run. Indeed, the `/repo-archive` directory was empty.

Until it jumped to 263 MB of data within a couple of seconds. I guess my Forgejo instance is
actually getting quite a lot of traffic!

# 🤖 Bastard Scrapers

Looking in the logs for Forgejo, I found that I was serving hundreds of requests per second to a
range of seemingly random IP addresses that were all asking for various parts of my Forgejo
instance. It was pretty clear that this was simple link-scraping behaviour: following links in the
order they turn up in the HTML. For example, following every link to the 29k commits of my fork of
[qmk_firmware], and every file, and so on.

Looks like I've become a victim of the latest evolution in stupid web scraping behaviour. The wide
range of IP addresses suggests this is probably scraping using a botnet: URLs fetched in-order, but
all the requests coming from a range of IP addresses from all over the world. I remember reading
about LWN.net having an issue with this in their 2025 article [Fighting the AI scraperbot scourge],
and again later by the FSF in [Our small team vs millions of bots]. I'm not sure whether sites are
being scraped by companies that are training LLMs, or whether this is just a coincidence, but both
LWN.net and the FSF seem to think so. Quoting from the FSF article:

> In addition, directory.fsf.org, the server behind the Free Software Directory, has been under
> attack since June 18. This likely is an LLM scraper designed to specifically target Media Wiki
> sites with a botnet. This attack is very active and now partially mitigated.

# Anubis to the Rescue

So I figured it was time to deploy [Anubis] by the awesome [Xe Iaso]. I first learned about Anubis
from Xe's article about [building native packages]. Anubis is a proxy that sits in front of your
website or application and uses one or more challenges to protect the upstream resource from
scrapers and bots. I think this is by a [Proof of Work] challenge that must be solved by the scraper
before it can access the resource.

{{< figure src="anubis-reject.png" title="Anubis rejecting a request" >}}

Whilst I'd heard from [Codeberg] that [bots are solving Anubis challenges], I wasn't sure whether
the latest version of Anubis had overcome this problem. Either way, I wanted to try it out.

## Adding Anubis to my Forgejo Instance

The server on which my Forgejo instance is running is fronted by a [Caddy] reverse proxy, which has
a simple configuration for the `git.blakerain.com` domain:

```caddyfile
git.blakerain.com {
    reverse_proxy localhost:6900
}
```

Forgejo is running in its own network, and exposes its HTTP interface on port 6900. I removed the
exposure of the HTTP interface from the Forgejo configuration, and instead exposed it from an Anubis
container that is configured to direct successful requests to the Forgejo instance:

```hcl
resource "docker_container" "anubis" {
  provider     = docker.target
  name         = "anubis_forgejo"
  image        = docker_image.anubis.image_id
  network_mode = "bridge"
  restart      = "unless-stopped"

  log_opts = {
    max-file = "3"
    max-size = "10m"
  }

  env = [
    "BIND=:3000",
    "TARGET=http://forgejo:${local.forgejo_port}"
  ]

  ports {
    internal = 3000
    external = var.external_port # Evaluates to 6900
  }

  networks_advanced {
    name    = docker_network.forgejo.name
    aliases = ["anubis"]
  }

  depends_on = [docker_container.forgejo]
}
```

I also updated the Caddy configuration for `git.blakerain.com` to include some headers that Anubis
recommends in [the documentation for Caddy]:

```caddyfile
git.blakerain.com {
    reverse_proxy localhost:6900 {
        header_up X-Real-Ip {remote_host}
        header_up X-Http-Version {http.request.proto}
    }
}
```

Applying these changes via Terraform and Anubis was up and running in under a minute, and has
quickly taken over the traffic to my Forgejo instance. The logs for Forgejo almost instantly ground
to a halt, with only the occasional request.

The logs from Anubis, on the other hand, quickly sprang to life with hundreds of messages. The logs
seem to be mostly about offering challenges to clients:

```
{
  "time": "2026-08-13T12:05:32.306960898Z",
  "level": "INFO",
  "source": {
    "function": "github.com/TecharoHQ/anubis/lib.(*Server).issueChallenge",
    "file": "github.com/TecharoHQ/anubis/lib/anubis.go",
    "line": 191
  },
  "msg": "new challenge issued",
  "subsystem": "anubis",
  "host": "git.blakerain.com",
  "method": "GET",
  "path": "/BlakeRain/qmk_firmware/src/commit/408f6e43cd2522b6a4073bedcfbe2ee7df2603dd/keyboards/whale/sk",
  "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.75 Safari/537.36",
  "accept_language": "en-US,en;q=0.9",
  "priority": "",
  "x-forwarded-for": "37.66.22.118",
  "x-real-ip": "37.66.22.118",
  "challenge": "019ffb03-6812-7e3e-b212-03ec5045dbfc",
  "weight": 10
}
```

Every now and then, Anubis is logging that a rule has been matched, and the request has been denied
(rather than challenged):

```
{
  "time": "2026-08-13T12:07:34.528068124Z",
  "level": "INFO",
  "source": {
    "function": "github.com/TecharoHQ/anubis/lib.(*Server).checkRules",
    "file": "github.com/TecharoHQ/anubis/lib/anubis.go",
    "line": 366
  },
  "msg": "explicit deny",
  "subsystem": "anubis",
  "host": "git.blakerain.com",
  "method": "GET",
  "path": "/BlakeRain/qmk_firmware/raw/commit/f0807ea64f97c5d2af856d987a7a5088676b38ad/keyboards/keebio/quefrency/rev5/config.h",
  "user_agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 (compatible; meta-externalagent/1.1 (+https://developers.facebook.com/docs/sharing/webmasters/crawler))",
  "accept_language": "en-US,en;q=0.9;q=0.9",
  "priority": "",
  "x-forwarded-for": "57.141.20.54",
  "x-real-ip": "57.141.20.54",
  "check_result": {
    "name": "bot/ai-catchall",
    "rule": "DENY",
    "weight": 0
  }
}
```

I guess this corresponds to the [`data/bots/ai-catchall.yaml`] file, which seems to test a rather
lengthy regular expression against the user agent string.

Visiting `git.blakerain.com` in the browser very briefly shows the Anubis challenge before loading
the Forgejo instance.

{{< figure src="anubis-screenshot.png" title="Anubis offering a challenge to the browser" >}}

# Conclusion

Deploying Anubis appears to have, so far, solved my problem of bots scraping my Forgejo instance. I
don't especially mind bots that scrape responsibly, but getting up to a couple of hundred requests
per second is a bit much for my tastes. Whilst putting a cache in front of my Forgejo instance would
probably also be a good idea, I'm not sure whether I want to go that far.

Perhaps I could look into using [Bunny's] CDN and their [DDoS protection]. I wonder if they have
something like Cloudflare's _Page Rules_ to bypass the cache for various paths.


[Anubis]: https://anubis.techaro.lol/
[Xe Iaso]: https://xeiaso.net/
[repository mirrors]: https://forgejo.org/docs/latest/user/repo-mirror/
[This task]: https://forgejo.org/docs/latest/admin/config-cheat-sheet/#cron---cleanup-old-repository-archives-cronarchive_cleanup
[qmk_firmware]: https://git.blakerain.com/BlakeRain/qmk_firmware/commits/branch/master
[Fighting the AI scraperbot scourge]: https://lwn.net/Articles/1008897/
[Our small team vs millions of bots]: https://www.fsf.org/blogs/sysadmin/our-small-team-vs-millions-of-bots
[bots are solving Anubis challenges]: https://social.anoxinon.de/@Codeberg/115033790447125787
[building native packages]: https://xeiaso.net/blog/2025/anubis-packaging/
[Proof of Work]: https://anubis.techaro.lol/docs/admin/configuration/challenges/proof-of-work
[Caddy]: https://caddyserver.com/
[the documentation for Caddy]: https://anubis.techaro.lol/docs/admin/environments/caddy
[`data/bots/ai-catchall.yaml`]: https://github.com/TecharoHQ/anubis/blob/10d172bafdde30e22fd998bf7067ebae75beea68/data/bots/ai-catchall.yaml
[Bunny's]: https://bunny.net/
[Codeberg]: https://codeberg.org/
[DDoS protection]: https://bunny.net/network/ddos-protection/
