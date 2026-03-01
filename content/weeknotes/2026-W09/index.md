---
date: 2026-03-01T12:44:00
summary: Moving to Bunny, 3D printing, and a "pheasant" surprise
coverImage:
  author: Riccardo
  url: https://www.pexels.com/photo/ice-river-photography-300857/
resources:
  - src: nash-penpot.FCStd
    title: Nash's display pen pot
---

This week has been quite busy: I've been spending some of my evenings tidying up some of my backups
and Terraform templates, making sure that everything is in working order. I've also [moved this
site] over to [Bunny CDN], and migrated a toy web application over to their Magic Containers.

[moved this site]: /blog/moving-site-to-bunny-net/
[Bunny CDN]: https://bunny.net/

# 📚 Reading

A new book arrived this week, along with a new issue of [Paged Out!]. I've also been catching up on
previous issues of [CACM], and I'm nearly ready to start on this years first issue: [volume 69, no
1]. I've also started working though the [AISI]'s publication [Understanding AI Trajectories]:
Mapping the Limitations of Current AI Systems.

[CACM]: https://cacm.acm.org/
[volume 69, no 1]: https://cacm.acm.org/issue/january-2026/
[AISI]: https://www.aisi.gov.uk/
[Understanding AI Trajectories]: https://www.aisi.gov.uk/blog/mapping-the-limitations-of-current-ai-systems

## Paged Out! Issue #8

Issue #8 of [Paged Out!] arrived this week. I really enjoy the idea of having one article per page.
The occasional page of artwork is very cool. I recommend giving these a read: they have some very
interesting nuggets of information, and the limit to a single page seems for force the authors to
create an effective gist of the topic. I learned about a library for serialising data using B-trees
called [lite³], which I'm going to have to play with.

You can the issues on the [Paged Out!] website as PDFs. I've been ordering the past three issues as
printed books, as they are quite fetching.

{{< gallery src="pagedout" >}}

[Paged Out!]: https://pagedout.institute/
[lite³]: https://lite3.io/

## The Genius of Lisp

A new book arrived this week: [The Genius of Lisp] by [Cees de Groot], which I learned about [on
Mastodon].

{{< book
    url="https://berksoft.ca/gol/"
    cover="the-genius-of-lisp.png"
    title="The Genius of Lisp"
    subtitle="A history of the greatest programming language ever created and the minds behind it"
    author="Cees de Groot"
    year="2026" >}}
Journey through the fascinating story of Lisp: How it came about and why it was designed the way it
was. Meet the geniuses involved in its creation, including Alonzo Church, Alan Turing, and the
father of Lisp and artificial intelligence, John McCarthy. Lisp has informed the design of most
programming languages in use today, and to learn how Lisp was constructed is to learn what
programming is all about.

Explore the mathematical foundations of the language and dive deeply into its earliest
implementation. Discover the characteristics of and differences between modern Lisps, how to
retro-compute like it’s the 1970's (and you’re a student at MIT), and why Emacs was forked. Get a
solid understanding of how this language was critical to early artificial intelligence work, from
ELIZA (the ChatGPT of its day) to Expert Systems for medical diagnosis. While Lisp is one of the
earliest programming languages, it is still in active use today (ever used EMACS?)
{{< /book >}}

I recently enjoyed [John McCarthy]'s 1981 article [The History of LISP]. In the discussion of the
implementation history, McCarthy was talking about the problems with using reference counting as
there were only a limited number of bits in a machine word, so they decided to use [garbage
collection]. The following line made me chuckle:

{{< quote author="John McCarthy" cite="The History of LISP" >}}
Once we decided on garbage collection, its actual implementation could be postponed, because only
toy examples were being done.
{{< /quote >}}

As an amateur programming language designed, I have on several occasions used the same excuse to
avoid paying attention to the subtleties of memory management and the interaction of a language's
runtime with a garbage collector. There are several language design decisions that, after
encountering problems in the collector, I've had grudgingly to walk back or modify.

[The Genius of Lisp]: https://berksoft.ca/gol/
[Cees de Groot]: https://cdegroot.com/
[John McCarthy]: https://en.wikipedia.org/wiki/John_McCarthy_(computer_scientist)
[The History of LISP]: https://dl.acm.org/doi/10.1145/800025.1198360
[garbage collection]: https://en.wikipedia.org/wiki/Garbage_collection_(computer_science)
[on Mastodon]: https://mstdn.ca/@cdegroot/116086771614712320

# 💡 Random Notes

My friend Rob Nash (of the awesome [Nashpacks]) asked me to design and 3D print a display pencil pot
for his increasingly large collection of mechanical pencils and fountain pens. I put this together
in [FreeCAD] and printed it on my [Ultimaker 2+]. You can download the FreeCAD file {{% download
file="nash-penpot.FCStd" %}}here{{% /download %}}.

{{< gallery src="penpot" >}}

And yesterday a Pheasant decided to spend part of the morning in my garden, wandering about picking
at things and occasionally screaming. Here's a picture of him in the overgrown grass (it's all
wintry and wet here in the UK).

{{< figure src="pheasant.jpg" width=400 enlarge=true title="Pheasant in the garden" >}}

[Nashpacks]: https://www.nashpacks.co.uk/
[FreeCAD]: https://www.freecad.org/
[Ultimaker 2+]: https://3dgbire.com/pages/ultimaker-2-plus
