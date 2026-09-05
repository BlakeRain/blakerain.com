---
title: My Favorite Technical Books
date: 2026-09-10T20:00:00
tags:
  - books
numberedHeadings: true
coverImage:
  author: Drew Coffman
  url: https://unsplash.com/@drewcoffman?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText
---

This post started out as a small collection of technical books that I'm most fond of, or that I felt
had a lot of value to me as a programmer. I felt like I should write up a short description of why
each book was significant, rather than leave the post as just a list of books.

Of course, this turned into an entire trip down memory lane, complete with some autobiographical
exposition --- some of which I'm worried about the veracity of! To be honest, my memory of my early
and teenage years is pretty vague at times. It's surprising to me how much I've pretty much entirely
forgotten.

<!--more-->

I've split this post up into a few sections: rather than be arranged chronologically, I've grouped
the books by topic:

<!--TOC-->

{% from "macros/book.html" import book %}

# The Early Years: C, C++, and the Unix System

Back when I was a teenager I had a range of computers: a series of PCs starting with a 386 that I
built with my neighbour, through a 486 and then various Pentiums and AMD Athlons. I later had a Sun
SPARC, which I think was my first 64-bit processor, just before I got an AMD Athlon 64 a few years
later.

We also had dial-up Internet access, where I spent far too much time talking on IRC. Eventually I
ended up befriending a wide range of people, one of whom gave me a [shell account] on a machine
running SunOS.

Another IRC friend gave me a shell account on a machine in the US, which was mighty handy as it had
much faster broadband than my poor UK dial-up. I think this account was the first to let me use the
`screen` multiplexer, which was really cool.

For those who aren't old enough to remember, shell accounts were basically Unix accounts on remote
servers that you could connect to via telnet or SSH. Some shell accounts allowed you to run a
multiplexer like `screen` or later `tmux`, which you could then _detach_ from, leaving those
programs running in the background. You could come back later and reattach to the session, and
continue where you left off.

{% from "macros/callout.html" import callout %}
{% call callout("note", "I still run `tmux` to this day") %}
Even now I'm writing this in neovim running in a tmux session on a PC upstairs that I'm SSHing
into from a Macbook on my sofa. Still sshing in, and still attaching to tmux sessions. Funny how
some things just stick around.
{% endcall %}

I remember being able to stay online was vitally important back then. Dial-up Internet was charged
by the minute, and if you were connected at peak times you could easily end up with quite a large
phone bill (which your mum would be furious about). But IRC didn't have any ability to catch-up with
the history of a channel, so if you were disconnected for a period you had to hope you could get at
the logs. Having a shell account where you could leave your IRC client (or a bouncer) running
indefinitely really felt like the best way to go about being online.

Anyway, you get the idea. Around this time I was starting to get thoroughly into the Unix
environment. I had a distinct feeling that Unix was where the _serious computing_ happened, not that
flimsy nonsense those people on Windows were doing! History wasn't entirely kind to me on that
count. I quickly ended up focussing on learning Unix and the C and later C++ programming languages.
These choices were echoed on my DOS and Windows machines, were I relied on [Turbo C++ 3] and later
[DJGPP].

Here are some of the early books that still have a lot of great memories for me.

[shell account]: https://en.wikipedia.org/wiki/Shell_account
[Demon Internet]: https://web.archive.org/web/20020124085443/http://www.demon.net/

{% call book(
    "https://www.librarything.com/work/1811777/t/Document-formatting-and-typesetting-on-the-UNIX-system",
    "Document Formatting and Typesetting on the UNIX System",
    author="Narain Gehani",
    cover="cover-troff.jpg",
    year="1986"
) %}
This is the first comprehensive book about the UNIX system document formatting facilities
(DOCUMENTER'S WORKBENCH software). The book contains a general discussion of formatting and an
extensive discussion of the UNIX system document formatting tools. One chapter each is devoted to
the **mm** macros (for specifying the document format), and the tools for specifying tables
(**tbl**), figures (**pic**) and equations (**eqn**). Other chapters summarize troff (the UNIX
system formatter) and WRITER'S WORKBENCH software. And, finally, the book contains several templates
for preparing a variety of documents, descriptions of the UNIX system typesetting commands, a
glossary and an annotated bibliography.

Although this book is written especially for readers with little or no experience with the UNIX
system formatting facilities, experienced readers will also find this book very useful. The novice
is gradually introduced to the document formatting/typesetting facilities. The reader familiar with
these facilities will learn about their advanced aspects
{% endcall %}

The first book I want to draw your attention to is a book about the Unix typesetting system Troff.
If you're anything like me, I can imagine just how excited you are at the thought of an obscure
typesetting system that most people have never heard of.

This book is an excellent introduction into using `troff`. And it gets even better: there's a
[second book] that describes the `grap` tool along with the `ms` macros.

At the time found this book [LaTeX] was definitely a thing, but I was blissfully unaware of it for
rather a long time. I _did_ have a copy of `troff` (in the old `SUNWdoc` package). I _think_ it was
the whole DWB suite, but I'm not so sure any more: my memory of these times is pretty hazy, but I
have fond memories of generating PostScript documents.

I found this book in [a charity shop in Headingley] in Leeds, and it unlocked a whole new world of
formatting documents. I remember using `troff` to format the write-up of my coursework: a level
editor for a game I was writing with a school friend.

Just like nowadays, everybody was keen on using word processors to write all their documents ---
mostly the Microsoft Word abomination. As an early neckbeard, I was very attracted to the idea that
I could write my documents in a text editor and use a series of macros and Makefiles to "build" my
documents in the same way I was building software. I was also very struck by the quality of the
typography that came out from typesetters. I used to have all sorts of PostScript tricks and hacks
to do all manner of silly things.

[LaTeX]: https://en.wikipedia.org/wiki/LaTeX
[second book]: https://www.librarything.com/work/7646664/t/Document-Formatting-and-Typesetting-on-the-Unix-System-Grap%25252F-Mv%25252F-MS-and-Troff-Document-Formatting-Typesetting-on-the-UNIX-Sytem
[a charity shop in Headingley]: https://maps.app.goo.gl/vkJPU8vPyiTUo3Eu5

{% call book(
    "https://www.librarything.com/work/3600740/t/The-C-Programming-Language-2nd-Edition",
    "The C Programming Language (2nd Edition)",
    author="Kernighan and Ritchie",
    cover="cover-c.jpg",
    year="1988"
) %}
Learn how to program in C from the developers of C, Brian Kernighan and Dennis Ritchie. Intended for
those with at least some experience with one other language (even if you are a novice), this book
contains a tutorial introduction to get new users started as soon as possible and separate chapters
on each major feature:

- Types, operators, and expressions
- Control flow
- Functions and program structure
- Pointers and arrays
- Structures
- Input and output

This second edition of The C Programming Language describes C as defined by the ANSI standard and
includes a reference manual that conveys the essentials of the standard in a smaller space for easy
comprehension for programmers.
{% endcall %}

This book was a great introduction to the C programming language, but I quickly came to realise that
the book was quite a bit of out date.

The first C compiler I used was [Borland's] C and C++ compiler: [Turbo C++ 3]. I think I quickly
moved to using the [GNU C Compiler] on Solaris, probably version 3 or something, then the same later
on Linux. This pushed me to prefer GCC on Microsoft DOS (and later Windows), so I ended up using
[DJGPP].

{% call callout("note") %}
Well, according to the [contents of the Solaris 8 software companion CD], I was using GCC 2.95.2.

It's amazing that these archives are available for us to check up on things like this.
{% endcall %}

This leads me nicely into the third book of this section: The C++ Programming Language.

[contents of the Solaris 8 software companion CD]: https://ia600701.us.archive.org/view_archive.php?archive=/16/items/sun-solaris-8-0101/sun-solaris-8-0101-software-companion-sparc.iso
[Borland's]: https://en.wikipedia.org/wiki/Borland
[Turbo C++ 3]: https://en.wikipedia.org/wiki/Turbo_C%2B%2B
[GNU C Compiler]: https://gcc.gnu.org/
[DJGPP]: https://www.delorie.com/djgpp/

{% call book(
    "https://www.librarything.com/work/11938782/t/The-C%2B%2B-Programming-Language-%7BSpecial-3rd-Edition%7D",
    "The C++ Programming Language (3rd Edition)",
    author="Bjarne Stroustrup",
    cover="cover-cpp.jpg",
    year="2003"
) %}
Written by the inventor of the language, the book is the defining, classic text on the language that
has become central to software development over the past five years. This third edition incorporates
additions and changes on a major scale. In particular, the new edition is based on the ANSI/ISO C++
final draft with its many new language features - templates, exceptions, namespaces, and run-time
type identification, to name a few - in addition to the C++ Standard Template Library that has
revolutionized C++ development.

Throughout, the book does far more than merely describe every element of the language. The focus is
on showing how the language is used as a tool for design and programming, and teaching the basic
concepts programmers need to master C++. With this third edition, Stroustrup has made the book even
more accessible to those new to the language while adding information and techniques that even
expert C++ programmers will find invaluable.
{% endcall %}

This book was hard for little me to get through. I started with an earlier edition of this book,
possibly the second edition, and it really was quite a learning curve. By the time I was finishing
high school I was already rather familiar with the language, and decided to take on the ridiculously
ambitious project of writing a C++ compiler. Suffice it to say, this book, along with the C++
specification (which I got for my birthday), was instrumental in my attempted implementation.

I bought my copy of the 3rd edition of this book from a fantastic bookshop in Leeds called Borders
Bookshop --- actually a US company --- that was a real favourite for a lot of Leeds folk. Their
original cafe used to have a fantastic range of coffees! I met a lot of really interesting people
there, and several friends of mine still have fond memories of Borders. Shame they're all gone now.

Anyway, I knew at the time that the compiler project was _far too ambitious_ for a teenager to pull
off. And of course, I never actually finished the compiler, giving up after I got stuck on template
instantiation. My frustration at the difficulties in implementing such an ambitious compiler were
further compounded by my increasing interest in computer graphics, which had begun to beat out my
interest in compilers.

Stroustrup's book has always been useful to have around, and I've got some real fond memories of
referring to it whilst arguing with people on IRC. Most of my career has been centered around C++.
Even though I've mostly been using languages like Haskell and Rust for the past fifteen years, I
still find myself writing C++ code on a fairly regular basis, and mostly on Unix-like systems.

{% call book(
    "https://www.librarything.com/work/10665/t/Advanced-programming-in-the-UNIX-environment",
    "Advanced Programming in the UNIX Environment",
    author="W. Richard Stevens, and Stephen A. Rago",
    cover="cover-adv-prog-unix.jpg",
    year="1992"
) %}
If you are an experienced C programmer with a working knowledge of UNIX, you cannot afford to be
without this up-to-date tutorial on the system call interface and the most important functions found
in the ANSI C library. Rich Stevens describes more than 200 system calls and functions; since he
believes the best way to learn code is to read code, a brief example accompanies each description.
{% endcall %}

These [Addison-Wesley] _Professional Computing_ books are a classic. Most of them are a bit dated
these days, but they're still a fantastic resource. I highly recommend that anyone who wants to get
a thorough understanding of Unix and Internetworking gets their hands on several of the books in
this series.

Whilst I'd had quite a lot of practical experience programming in C on Unix, a lot of what I learned
was from available source code (which was not as common as it is nowadays), lengthy experimentation,
long conversations on IRC, and a dash of `man` pages.

This book in particular was a significant contributor to a much more concrete understanding of
programming on Unix. That blurb on the back-cover, it turns out, was not just marketing hype.
Looking back, just the chapters on threading and thread control were of incalculable value to me
then and even later on in my career.

I'm probably not really exaggerating when I say that this book, especially it's third edition, is
possibly one of the most important books for anybody doing any programming in a Unix-like
environment. Even the historical accounts in the book are wonderful.

{% from "macros/quote.html" import quote %}
{% call quote(author="W. Richard Stevens, and Stephen A. Rago") %}
During the early 1980s, the UNIX System was considered a hostile environment for running multiuser
database systems. (See Stonebraker \[1981] and Weinberger \[1982].) Earlier systems, such as Version
7, did indeed present large obstacles, since they did not provide any form of IPC (other than
half-duplex pipes) and did not provide any form of byte-range locking. Many of these deficiencies
were remedied, however. By the late 1980s, the UNIX System had evolved to provide a suitable
environment for running reliable, multiuser database systems. Since then, numerous commercial firms
have offered these types of database systems.
{% endcall %}

[Addison-Wesley]: https://en.wikipedia.org/wiki/Addison-Wesley

{% call book(
    "https://www.librarything.com/work/46099/t/UNIX-System-Administration-Handbook",
    "UNIX System Administration Handbook",
    author="Nemeth, Hein, Seebass, and Snyder",
    cover="cover-unix-handbook.jpg",
    year="1995"
) %}
{% endcall %}

# Graphics and Game Programming

{% call book(
    "https://www.librarything.com/work/202092/t/Tricks-of-the-Game-Programming-Gurus",
    "Tricks of the Game-Programming Gurus",
    author="Andre LaMothe",
    cover="cover-tricks.jpg",
    year="1994"
) %}
{% endcall %}

{% call book(
    "https://www.librarything.com/work/180791/t/Black-Art-of-3D-Game-Programming-Writing-Your-Own-High-Speed-3D-Polygon-Video-Games-in-C",
    "Black Art of 3D Game Programming",
    author="Andre LaMothe",
    cover="cover-black-art.jpg",
    year="1995"
) %}
The first book I ever ordered from Amazon.
{% endcall %}

{% call book(
    "https://www.librarything.com/work/187966/t/Michael-Abrashs-Graphics-Programming-Black-Book-Special-Edition",
    "Graphics Programming Black Book",
    author="Michael Abrash",
    cover="cover-black-book.jpg",
    year="1997"
) %}
{% endcall %}

## Focussing more on Graphics

{% call book(
    "https://www.librarything.com/work/135553",
    "Computer Graphics: Principles and Practice",
    author="Foley, van Dam, Feiner, Hughes, and Philips",
    cover="cover-cg-p-and-p.jpg",
    year="1990"
) %}
{% endcall %}

{% call book(
    "https://www.librarything.com/work/21529559/t/OpenGL-R-Programming-Guide-The-Official-Guide-to-Learning-OpenGL-Version-1-2-3rd-Edition",
    "OpenGL Programming Guide",
    author="Mason Woo",
    cover="cover-gl.jpg",
    year="1999"
) %}
{% endcall %}


# Compilers

{% call book(
    "https://www.librarything.com/work/15664/t/Compilers-Principles-Techniques-and-Tools",
    "Compilers, Principles, Techniques and Tools",
    author="Aho, Sethi, and Ullman",
    cover="cover-dragon.jpg",
    year="1986"
) %}
The _dragon book_ :D
{% endcall %}

{% call book(
    "https://www.librarything.com/work/11763657/t/The-Garbage-Collection-Handbook-The-Art-of-Automatic-Memory-Management",
    "The Garbage Collection Handbook",
    author="Richard Jones",
    cover="cover-gc-handbook.jpg",
    year="1996"
) %}
A book about the art of garbage collection.
{% endcall %}


# Discovering Linux and the Networking

{% call book(
    "https://www.librarything.com/work/13011/t/TCP%25252FIP-Illustrated-Volume-1-The-Protocols",
    "TCP/IP Illustrated, Volumes 1",
    author="W. Richard Stevens",
    cover="cover-tcp-ip.jpg",
    year="1983"
) %}
{% endcall %}

{% call book(
    "https://www.librarything.com/work/20328418/t/3-ed-Linux-Kernel-Development",
    "Linux Kernel Development",
    author="Robert Love",
    cover="cover-linux-kernel.jpg",
    year="2010"
) %}
{% endcall %}

{% call book(
    "https://www.librarything.com/work/533092/t/Linux-IP-Stacks-Commentary-Guide-to-Gaining-Insiders-Knowledge-on-the-IP-Stacks-of-the-Linux-Code",
    "Linux IP Stacks Commentary",
    author="Stephen T. Satchell",
    cover="cover-linux-ip.jpg",
    year="2000"
) %}
{% endcall %}

{% call book(
    "https://www.librarything.com/work/1056895/t/Understanding-Linux-Network-Internals",
    "Understanding Linux network Internals",
    author="Christian Benvenuti",
    cover="cover-linux-internals.jpg",
    year="2006"
) %}
{% endcall %}

{% call book(
    "https://www.librarything.com/work/13005/t/Introduction-to-Algorithms",
    "Introduction to Algorithms",
    author="Cormen, Leiserson, Riverst, and Stein",
    cover="cover-intro-algo.jpg",
    year="2009"
) %}
{% endcall %}


# Modern Day

In what I'll call the _Modern Day_, there's been a few more books that I think have been
significant.

One of the more recent books I've acquired is _Run Your Own Mail Server_ by Michael W. Lucas. Many
of you may know him as [mwl], author of a crazy number of books, and who writes for the [FreeBSD
Journal]. This book has been a huge help to me.

I've run a mail server for a while now. According to the Linode (now Akamai) who host the VPS, I
set up the server in 2011. To be honest, 15 years ago I still wasn't very good at running a mail
server, and I made some critical mistakes that I'm likely going to have to address at some point.

In the meantime, I've done the right thing and ignored the problem in hopes that it'll go away, and
migrated much of my email hosting to a new mail server. Then I found that Michael was running a
Kickstarter campaign for publishing his new book.

[mwl]: https://mwl.link/
[FreeBSD Journal]: https://freebsdfoundation.org/our-work/journal/

{% call book(
    "https://mwl.link/run-your-own-mail-server.html",
    "Run Your Own Mail Server",
    author="Michael W. Lucas",
    cover="cover-ryoms.jpg",
    year="2024"
) %}
Message services appear and disappear, but email remains. One of the Internet's oldest and most open
protocols, email reaches everywhere. Dominated by a handful of carriers, yet still manageable by the
rest of us. If you do it right.Setting up the email server is the easy part. The protocols that
support email? Those are hard. SPF. DKIM. DMARC. BIMI and MTA-TLS and TLS-RPT. DNS standards that
apply to nothing else on the modern Internet. Block lists. Graylisting. Email is a protocol unlike
any other, yet among our most essential. Never surrender the protocols. Reclaim your connections.
Run your own mail server.
{% endcall %}

I highly recommend this book to anyone who wants to run their own mail server. I made quite a few
changes to how I normally roll based on Michael's advice.

Another set of books I've been reading is the works of [Cory Doctorow]. I've got quite a lot of
books of his now: so much so that he's now got his own shelf in my living room just to himself.

{% from "macros/figure.html" import figure %}
{{ figure("doctorow-shelf.jpg", height=1071, enlarge=true, caption="A shelf of Cory Doctorow's books") }}

Whilst not strictly speaking technical books, I definitely recommend almost all of Cory Doctorow's
books. If you like science fiction with a strong dose of reality --- from IP and privacy challenges
to key-signing parties --- Doctorow's stories are definitely going to be up your street. Some of my
favourites of his fiction books include [Makers], the [Little Brother] series, and the more recent
[Martin Hench] series.

His non-fiction books are probably the most important. The most recent of which is his book
_Enshittification_, which describes the process of how everything online became terrible, and what
we can do about it.

{% call book(
    "https://bookshop.org/p/books/enshittification-why-everything-suddenly-got-worse-and-what-to-do-about-it-cory-doctorow/d3f8483b158906ce",
    "Enshittification",
    author="Cory Doctorow",
    cover="cover-ensh.jpg",
    year="2025"
) %}
Enshittification: It’s not just you — the internet sucks now. It’s been enshittified. That was no
accident, and it’s not gonna fix itself. Here’s how we’ll disenshittify it so we can have a new,
good internet.
{% endcall %}

[Cory Doctorow]: https://craphound.com/
[Makers]: https://craphound.com/makers/about/
[Little Brother]: https://craphound.com/littlebrother/about/
[Martin Hench]: https://craphound.com/category/redteamblues/
