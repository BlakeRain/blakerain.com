---
title: Moving a Toy Application To Bunny's Magic Containers
date: 2026-03-04T19:00:00
tags:
  - bunny
  - docker
---

Since [moving my website] over to Bunny's CDN I've been starting to get to grips with Bunny's other
offerings. Having made use of [Bunny Storage] and [Bunny CDN], I have three more Bunny products that
I want to still want to explore: [Magic Containers], [Edge Scripting], and [Bunny Database]. So, I
decided to move my [cement] application over to Bunny.

<!--more-->

After moving `blakerain.com` to [Bunny's DNS] I wanted to next try out their Magic Containers and
Bunny Database:

- [Magic Containers] allows you to deploy Docker containers to Bunny's network. Containers are
  arranged together into an application, where the constituent containers are within the same
  network. A CDN pull zone can be created to deliver an application to users over the Internet.
- [Bunny Database] is a DBaaS offering that allows you to deploy an SQLite-compatible database to
  Bunny's network, and Bunny take care of making sure writes are replicated. This is built on top of
  [Turso]'s [libSQL] library.




[moving my website]: /blog/moving-site-to-bunny-net/
[Bunny Storage]: https://bunny.net/storage/
[Bunny CDN]: https://bunny.net/cdn/
[Magic Containers]: https://bunny.net/magic-containers/
[Edge Scripting]: https://bunny.net/edge-scripting/
[Bunny Database]: https://bunny.net/database/
[cement]: https://git.blakerain.com/BlakeRain/cement
[Bunny's DNS]: https://bunny.net/dns/
[libSQL]:https://github.com/tursodatabase/libsql
[Turso]: https://turso.tech/
