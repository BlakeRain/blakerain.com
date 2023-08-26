---
title: New Site and Blog
tags:
  - ghost-tag
  - linux
  - aws
published: 2019-10-31T19:44:00.000Z
cover: /content/new-site-and-blog/cover.jpg
excerpt: |
  I have a new website and blog using the Ghost platform. Here I touch on the setup and the goals for
  this site.
---

**tl;dr** New website using [Ghost](https://ghost.org/) was easy to set up.

So I now have a new website. It's been quite a while since I had anything resembling a website that wasn't something corporate. My last website died a few years ago, mostly from lack of updates or any fresh content. You can still see the old source code on [GitHub](https://github.com/HalfWayMan/meadowstalk), where the last commit was in 2016. For the past year or so I've been planning a new website with some vague notion of posting some thoughts, tutorials and no doubt other nonsense. Of course, planning and execution are entirely different things, but hopefully I'll be better with this one than I was the last.

So for this first post I wanted to share some information relating to how I set up the site by (mostly) following simple instructions. I also wrote some weak Python code to provide a simple search feature, which I shall explain in a subsequent post.

See here for adding search: [https://blakerain.com/blog/adding-search-to-ghost](http://localhost:2368/blog/adding-search-to-ghost)

### Ghost CMS

I've used [Ghost](https://ghost.org) to create this website. Ghost is a CMS, written in JavaScript, that provides a nice set of features without seeming to be too bloated.

```bookmark
url: "https://ghost.org"
title: "Ghost: The #1 open source headless Node.js CMS"
description: |
  The world’s most popular modern open source publishing platform. A headless Node.js CMS used by
  Apple, Sky News, Tinder and thousands more. MIT licensed, with 30k+ stars on Github.
publisher: Ghost
author: "Albert Henk van Urkalberthenk.com"
thumbnail: "https://ghost.org/images/meta/Ghost.png"
icon: "https://ghost.org/icons/icon-512x512.png?v=188b8b6d743c6338ba2eab2e35bab4f5"
```

Apart from it's small size and not being built in PHP, some of the features that attracted me to Ghost are:

- It comes under a permissive [MIT license](https://github.com/TryGhost/Ghost/blob/master/LICENSE).
- Has quite a nice [editor](https://ghost.org/faq/using-the-editor/) for creating content, including the ability to use Markdown or add HTML.
- It uses simple Handlebars-based [themes](https://ghost.org/docs/api/v3/handlebars-themes/) that are pretty easy to construct.
- Ghost seems to play nicely with mobile out of the box, although this is likely to be very theme dependent.
- There are [content](https://ghost.org/docs/api/v3/content/) and [administration](https://ghost.org/docs/api/v3/admin/) APIs for me to exploit, along with [web-hooks](https://ghost.org/docs/api/v3/webhooks/).
- I quite like working with JavaScript.
- Ghost seemed easy to self-host, which is usually my preferred option.

### Deploying Ghost

For the most part, installation of Ghost required following the instructions on the Ghost website. I roughly followed the guide for Ubuntu, as that is the distribution I chose:

```bookmark
url: "https://ghost.org/docs/install/ubuntu/"
title: "How to install & setup Ghost on Ubuntu 16.04 + 18.04"
description: |
  A full production install guide for how to install the Ghost professional publishing platform on
  a production server running Ubuntu 16.04 or 18.04.
author: Ghost
publisher: Ghost
thumbnail: "https://ghost.org/images/meta/Ghost-Docs.jpg"
icon: "https://ghost.org/icons/icon-512x512.png?v=188b8b6d743c6338ba2eab2e35bab4f5"
```

To deploy Ghost I first created an AWS instance with Ubuntu 18.04 and attached an EIP to it. I used an EIP in case I needed to replace the instance (such as if it entered a degraded state), or I wanted to use an ELB or some other magic. I configured the security group for the instance's sole network interface to allow SSH from my own IP along with HTTP and HTTPS from anywhere else:

| Port    | Source CIDR | Description                |
| ------- | ----------- | -------------------------- |
| tcp/22  | MY-IP/32    | Let me SSH into the server |
| tcp/80  | 0.0.0.0/0   | Allow HTTP over IPv4       |
| tcp/80  | ::/0        | Allow HTTP over IPv6       |
| tcp/443 | 0.0.0.0/0   | Allow HTTPS over IPv4      |
| tcp/443 | ::/0        | Allow HTTPS over IPv6      |

Once the instance had started and I was able to SSH in to it, I made sure that the latest updates had been run and checked that `unattended-upgrades` was also in effect:

```bash
sudo apt update && sudo apt upgrade -y
systemctl status unattended-upgrades.service
```

The Ghost Ubuntu server setup suggests logging in with the root user and then creating a user for yourself. This is not really necessary with the Ubuntu variant used by AWS, as the default user of `ubuntu` was sufficient for me. I skipped forwards to the step that suggested I install NGINX, NodeJS and then the Ghost CLI. I didn't install MySQL, as I don't want to run that on the web server.

```bash
# Install the NGINX server
sudo apt install nginx

# Download NodeJS v10 and install
curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash
sudo apt install nodejs

# Install the Ghost CLI tool
sudo npm install ghost-cli@latest -g
```

For the database I set up a MySQL instance on AWS RDS. This means that I can better control the scale (and cost) of the database, and I also get daily snapshots and security updates.

After setting up the RDS instance, I followed the [instructions](https://ghost.org/docs/install/ubuntu/#install-ghost) to install Ghost in the `/var/www/` directory, which is is mostly a case of creating the directory under `/var/www/` and then running `ghost install`. The CLI prompted for some questions which were very easy to answer and then proceeded to install Ghost into the chosen directory. This installation included the set up of [Let's Encrypt](https://letsencrypt.org/), which I managed to ruin. Luckily running `ghost setup ssl` sorted the problem.

Finally I could make sure that the site was running using `ghost ls`, which gave some rather nice output:

![](/content/new-site-and-blog/image-17.png)

### Customizing Ghost

Once I had an installation that was working I wanted to be able to customize it. The first thing I wanted to do was to make sure that the site was not generally available. Conveniently Ghost includes a simple way of doing this by switching the site to private, disabling access, SEO and social features. This option can be found in the **General** settings of the administration portal:

![](/content/new-site-and-blog/image-1-1.png)

Once the site was private I felt more confident playing around with the Ghost settings, testing the publishing options and the site structure, without fear of exposing my utter incompetence. There are several options relating to site metadata and social stuff which I don't understand. You can apparently link it to you Facebook Page, however as I'm not a boomer I don't have a Facebook Page. You can link it to Twitter as well it seems, but I don't use Twitter either.

There are a lot of integrations that can work with Ghost, which are listed on the Ghost website:

```bookmark
url: "https://ghost.org/integrations/"
title: "Ghost Integrations – Connect your favourite Tools & Apps to your site"
description: |
  Keep your stack aligned and integrate your most used tools & apps with your Ghost site:
  automation, analytics, marketing, support and much more! 👉
publisher: Ghost
thumbnail: "https://ghost.org/images/meta/Ghost-Integrations.jpg"
icon: "https://ghost.org/icons/icon-512x512.png?v=188b8b6d743c6338ba2eab2e35bab4f5"
```

I've really only used the built-in [Unsplash](https://ghost.org/integrations/unsplash/) integration along with [Commento](https://ghost.org/integrations/commento/) to provide embedded comment threads.

After messing around with the tags, routing and other settings it was time to settle on a theme. Ghost has a large set of themes available on their [marketplace](https://ghost.org/marketplace/), many of which are free to use if you're so inclined.

```bookmark
url: "https://ghost.org/marketplace/"
title: "Ghost Themes - The Marketplace"
description: |
  Discover beautiful professional themes for the Ghost publishing platform. Custom templates for
  magazines, blogs, news websites, content marketing & more!
author: Ghost
icon: "https://ghost.org/icons/icon-512x512.png?v=188b8b6d743c6338ba2eab2e35bab4f5"
```

After much indecision I decided to settle on the default theme for Ghost, which is called [Casper](https://demo.ghost.io). The theme that I am using is actually a slightly modified version. I only made a few minor changes, mostly relating to colors and to add a few custom templates. You can find the sources for my customization here:

[https://github.com/HalfWayMan/blakerain.com](https://github.com/HalfWayMan/blakerain.com)

Hopefully now that this is all set up I will remember to start writing posts more often than once per year!
