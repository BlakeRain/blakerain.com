---
title: Bunny.net shared storage zones
link: https://dbushell.com/2026/03/04/bunny-shared-storage-zones/
date: 2026-03-03T10:05:00
tags:
  - bunny
  - cdn
---

[David Bushell] has also been migrating things to [Bunny] as [I have been doing]. He has a cool
suggestion here to use [edge rules] to override the origin URL for requests that match to common
resources, replacing the origin with a shared storage zone.

This is a great idea, and would be very handy for things like `.well-known/` and `robots.txt` (what
David demonstrates it with).

I wonder how useful this would be for redirecting to other origin servers, like a [magic container]
or an [edge function].


[David Bushell]: https://dbushell.com/
[Bunny]: https://bunny.net/
[I have been doing]: /blog/moving-site-to-bunny-net/
[edge rules]: https://docs.bunny.net/cdn/edge-rules
[magic container]: https://docs.bunny.net/magic-containers
[edge function]: https://docs.bunny.net/scripting
