---
title: Self-hosting
summary: A list of things that I self host.
---

Inspired by [Matze's page](https://kittsteiner.blog/self-hosting/), below is a list of the services
an software that I self-host. This is not an exhaustive list, and some of it is conflated with
[blacktreenetworks.com](https://blacktreenetworks.com/) stuff, but it covers the main things I use.

- [Active Pieces](https://activepieces.com/) - An open-source alternative to Zapier for workflow
  automation. This is useful for creating simple automations for webhooks. One example I use is to
  receive events from a [Tailscale webhook](https://tailscale.com/kb/1213/webhooks) and send a
  message to [ntfy.sh](https://ntfy.sh/) when a device's key is about to expire.
- [Atuin](https://atuin.sh/) – A shell history manager. I self-host the server component.
- [Caddy](https://caddyserver.com/) – Web server and reverse proxy. I use it to manage TLS
  certificates with [Let's Encrypt](https://letsencrypt.org/), and to route traffic to the various
  services I run. Pretty much everything is behind Caddy.
- [Cement](https://github.com/BlakeRain/cement) – A self-hosted pastebin service. You can find it at
  [paste.blakerain.com](https://paste.blakerain.com/). This is one of my own projects.
- [Forgejo](https://forgejo.org/) – A recent edition to my self-hosted services. I used to run
  [Gitea](https://about.gitea.com/) but migrated to Forgejo. This can be found at
  [git.blakerain.com](https://git.blakerain.com/). This is basically a hedge against GitHub going
  completely evil, and I also use it for private repositories.
- [Homebox](https://homebox.software/en/) – Self-hosted inventory management software. I host this
  at home, just to keep track of components and other bits and pieces. Where are all the cables and
  Raspberry Pis? Homebox (probably) knows!
- [Linkding](https://linkding.link/) – A self-hosted bookmark manager, that I can use to share links
  with others. You can find my public bookmarks at [links.blakerain.com](https://links.blakerain.com/).
- [Minecraft](https://www.minecraft.net/en-us) – I run a small Minecraft server with some friends.
  The server is running 1.20.1 modded with [Forge](https://files.minecraftforge.net/) and our own
  [modpack](https://github.com/bans-minecraft/modpack). We also have a
  [mod](https://github.com/bans-minecraft/utamacraft) for some custom functionality.
- [Open WebUI](https://github.com/open-webui/open-webui) – Self-hosted interface to LLMs. Useful for
  shouting at LLMs via API with a reasonable UI.
- [Parcel](https://github.com/BlakeRain/parcel) – A self-hosted file sharing service. Actually
  another project of mine. I use it to share files with friends and family, with some teams
  configured for different groups.
- [Postfix](https://www.postfix.org/) + [Dovecot](https://www.dovecot.org/) – I run my own email
  server. The build is quite custom, not an off-the-shelf deployment. There's software to manage all
  the domains and mailboxes. I'll probably open source it all at some point.
- [Plausible Analytics](https://plausible.io/) – A privacy-focused web analytics tool. I mostly use
  this to track visits to my personal website and blog. It's very lightweight, so I find it useful
  to fire events into it to track app usage and so on.
- [Roundcube](https://roundcube.net/) – Webmail client. Everybody knows Roundcube.
- [SearXNG](https://github.com/searxng/searxng) – A self-hosted metasearch engine. I use this as my
  default search engine. It aggregates results from multiple search engines, and is privacy-focused.
  I run this in Docker on a Raspberry Pi at home, and access it via Tailscale (see their [Tailscale
  in Docker](https://tailscale.com/kb/1282/docker) KB article).
- [Uptime Kuma](https://github.com/louislam/uptime-kuma) – My favourite uptime monitor. It has lots
  of functionality. I've found it to be the most reliable. You can find my public status page at
  [status.blakerain.com](https://status.blakerain.com/).

# IaC

I mostly use [Terraform](https://www.terraform.io/) to manage the above, along with services I host
for others that I've not mentioned. I have a few repositories that contain the code for different
parts of the infrastructure. Unfortunately, these are all private repositories, but they are not
very complex. Mostly I'm using the [AWS](https://aws.amazon.com/) and [Docker](https://www.docker.com/)
providers. I might open source some of the code, like the mail server setup.

# Backups

All my backups are done using [Borg](https://borgbackup.readthedocs.io/en/stable/), with some
scripts to automate the process. Typically Borg runs in a Docker container and backs up volumes from
other containers, pushing to external storage. I use two main services for external storage:

- [rsync.net](https://rsync.net/) – they give you an empty UNIX filesystem to access with any SSH
  tool. Been around for ages.
- [Hetzner Storage Box](https://www.hetzner.com/storage/storage-box/) – Similar offering from our
  friends in Germany. I use Hetzner for dedicated servers too.


