---
date: 2026-08-31T15:26:00
summary: Server boot loops, a new website generator, Zotero sync, and EdenAI silent treatment
coverImage:
  author: Blake Rain
---

Well it's only been four weeks this time. Maybe I'm getting a bit better remembering to actually
take notes of what's been going on, so I have something to write about in these weeknotes.

# 🖥️ Server Breakdown and Replacement

One of the servers that lives in my house --- given the hostname `blue` --- decided to disappear
from the network after a reboot. Of course, to find out what happened I had to drag the thing out of
the corner of the room onto the coffee table, and then get a monitor out of a cupboard, only to be
presented with an error during boot saying "_One or more boot drivers have reported issue(s)_",
followed a message saying that I needed to load the _Driver Health Manager_. Sounds wonderful.

Pressing the any key took me to the _Driver Health Manager_, which announced that there was a
problem with the _PERC H330 Adapter_. Opening the adapter configuration revealed a critical message
suggesting that an L2/L3 cache error was detected on the RAID controller. Sounds like a problem. The
error message said that I could press `X` to continue... Not sure where to find an `X`, but
selecting _Exit_ simply reboots and takes me back to the same error. Same with selecting any of the
boot options like entering the BIOS setup.

I get why people hate these things, I really do.

According to [Dell], the cause of this stupid boot loop is as follows:

> When this condition occurs and the system BIOS is set to UEFI mode, PERC H330 passes an invalid
> response to the critical message handling acknowledgment request. This results in the controller
> being stuck in this state.

Well I'm certainly stuck. Shall I just throw the machine in the bin? Dell recommends that an update
to the firmware will fix the issue. However, I couldn't get into the bios in order to apply any
updates. Turns out Dell are aware of that problem too:

> Updating the firmware can prevent recurrence, but UEFI boot firmware cannot be updated as it fails
> POST. Resolving this requires additional effort.

Quite so. Thanks Dell. For UEFI systems, Dell recommends to first clear the NVRAM, which requires
changing a jumper on the motherboard. After looking up where the jumper is located, faffing about
trying to figure out where to move the jumper, then finally booting the server again ... the server
dropped me _right back into the same boot loop_. Fantastic.

> If the issue repeats after clearing the NVRAM, follow the steps below to update the firmware.

Glad to know I might not be the only fool stuck in this loop. By the way, how do I tell if the NVRAM
reset actually did anything?

> Since it does not pass through the POST and is not able to enter the BIOS if the H330 is
> installed, the H330 must be removed once.

Ah. Great. So I've gotta remove the H330, and hopefully then the computer will boot. But does that
mean I can still install the H330 update? No, turns out that I have to change over to BIOS mode
(from UEFI), then _reinstall the H330_, and then I can update the firmware 😒

Opening up the server, again, I found the H330 sat there all smug like:

{% from "macros/figure.html" import figure %}
{{ figure(src="h330.jpg", caption="H330 adapter in the server") }}

By this point I'd lost the will to continue. I have a spare server of the same model in the cupboard
of spares. And that one had a second processor in it. So I removed the RAM and all the drives from
this server, and installed them into the spare server.

Of course, the spare server wasn't configured to boot into UEFI, the irony of which is not lost on
me. I also had to switch the server to plain HBA mode, as the drives were set up using Linux's
software RAID, so they wouldn't boot. At least now I have double the cores of the previous server,
although I forgot to install the extra RAM 🙄

[Dell]: https://www.dell.com/support/kbdoc/en-us/000067945/perc-h330-14g-l2-l3-cache-error-detected-on-the-raid-controller-during-boot

# 🪚 New Website Generator

I've been wanting to build a new website generator for about a year now. What with me being
unemployed, I've finally had the time to get on with it. I've written about the changeover in a
[previous blogpost], so you can read about it there if you're interested. The tl;dr is that I've
built a website generator that uses [minijinja] as the templating engine, and uses a bunch of small
tools to generate the HTML files.

[previous blogpost]: /blog/a-new-website-builder/
[minijinja]: https://crates.io/crates/minijinja

# 📖 Zotero Sync

I've used [Zotero] for quite a long time now. Mostly I use it to store papers and technical books,
and any highlights and short notes I take go into Zotero. I even, on occasion, print out a paper or
buy a physical copy of a book, make my highlights there, and then transfer them into Zotero. So,
I've come to depend on the software quite a lot.

I also have a script that periodically scans my Zotero library for highlights, and transfers those
highlights into my [Obsidian] vault. This makes it much easier to refer to highlights in one place
whilst doing any kind of write-ups or research notes.

Recently I've been feeling a bit of friction with the way that I've been syncing my Zotero library.
The way I've been syncing my library is to use a [Syncthing] share that lives on a Raspberry Pi with
2TB of fast SSD storage called `pink`, as opposed to the more spacious spinning-rust in the `blue`
server that I had to replace. Then I sync the library using Syncthing on various devices, primarily
my laptop (a Macbook Pro M1) and my desktop (a PC running Linux).

This has worked quite well for years, but I've had a couple of issues, one of which was very severe.
The first, and minor issue, is that there's no way for me to easily capture anything into Zotero
from my mobile devices (e.g. from my iPhone whilst endlessly scrolling [Lobste.rs] and
[Hackernews]). More concerning, I've recently had some collisions where I've lost entries in
Zotero's database.

The loss of database sync actually caused quite a bit of consternation when I discovered that I'd
lost an entire entry and all its highlights. Specifically it was the paper [Towards a Science of AI
Agent Reliability] by Narayanan and Kapoor, which I briefly [wrote about] in February.

Luckily I have backups of all devices and storage at quite a high granularity and going back years,
so I was able to resurrect the lost entry from a backup of `pink` back in mid-June.

{% from "macros/callout.html" import callout %}
{% call callout("note") %}
I really should write up how I do all my backups at some point.
{% endcall %}

This was enough of a scare to make me reconsider the way that I've been syncing Zotero. I also would
really like to be able to access my library on my iPad (and to a lesser extent, my iPhone). So I've
finally decided to take the plunge and sign up for Zotero's sync service.

Turns out their sync service is pretty pricey at $60 a year for 6 GB of storage. My library is just
over 3.2 GB, so I'm already using 54% of the storage offered. The bump up to unlimited storage is
$120 a year. For $129.60 a year I can get 800 GB of storage from [rsync.net], so the pricing for
Zotero is a bit out of whack for what I'm used to. But I get the software for free, and I'm
supporting more [open source software], which is a good thing ❤️

After dropping all the Syncthing stuff from the Zotero data directory on my laptop, I was able to
simply sign in to Zotero and press the sync button. It uploaded the three gig of PDFs and eBooks in
about twenty minutes. I left the desktop syncing with `pink` over Syncthing so I still get my hourly
backups.

On mobile devices, the Zotero app only downloads the metadata --- which is an SQLite database on
desktop --- and the PDFs and eBooks are only downloaded when I actually open them, which is entirely
sensible. I have problems capturing things though: when I use the share sheet to share a webpage I
only get a link in the app. Even for something from the [ACM DL] or [Arxiv]. Unlike the desktop app,
or when you use the Zotero browser extension, it doesn't also capture any PDF attachments. This
leaves me in my old process of capturing links in Obsidian daily notes and then periodically
capturing them via the Zotero browser extension when I'm on a desktop machine.

At least I shouldn't lose any more highlights or notes. I'll keep my backups though, thank you 😮‍💨

[Zotero]: https://www.zotero.org/
[Obsidian]: https://obsidian.md/
[Syncthing]: https://syncthing.net/
[Lobste.rs]: https://lobste.rs/
[Hackernews]: https://news.ycombinator.com/
[Towards a Science of AI Agent Reliability]: https://arxiv.org/abs/2602.16666
[wrote about]: /blog/ai-agent-reliability/
[rsync.net]: https://www.rsync.net/index.html
[open source software]: https://github.com/zotero
[ACM DL]: https://dl.acm.org/
[Arxiv]: https://arxiv.org/

# 📝 Reading

I received the print copy of [Build a Reasoning Model (from Scratch)] by [Sebastian Raschka]. I
quite enjoyed his first book: Build an [LLM from Scratch]. I had fun following along with [Giles
Thomas] and his [blog post series] following the book.

{% call callout("tip") %}
Giles' recent posts in the [Why do OpenAI's GPT-2 weights beat mine] series are really great:

> So: OpenAI weights good, mine (relatively) bad. Their smaller model, being tested for loss on a
> less-familiar-looking test set, does better -- or at least only a tiny bit worse than -- my larger
> ones. And when instruction fine-tuned, it converges on a better-performing result, and does it
> faster.
>
> What could the difference be?
{% endcall %}

So when [I found out] last year that Raschka was writing a second book, this time on training
reasoning models, I was pretty excited. I [eventually noticed] that the book was available on MEAP,
although I didn't keep up with the chapter releases 🙄

{% from "macros/book.html" import book %}
{% call book(
    "https://www.manning.com/books/build-a-reasoning-model-from-scratch",
    "Build a Reasoning Model (from Scratch)",
    cover="cover-barmfs.jpg",
    author="Sebastian Raschka",
    year="2026",
    rating=5
) %}
Build a Reasoning Model (From Scratch) is a practical guide to understanding how modern
reasoning-oriented LLMs work by building their core methods step by step. The book tells a clear
engineering story: start with a conventional pre-trained LLM, learn how text generation works, build
reliable evaluation tools, improve reasoning through inference-time methods, then move into
training-based approaches such as reinforcement learning and distillation.
{% endcall %}

I'm about a third of the way through the book, having just finished chapter 3 on evaluating
reasoning models. Next up is [chapter 4], which goes into "_inference-time scaling_", which is
basically CoT and friends (aka [Let's think step-by-step]).

[Build a Reasoning Model (from Scratch)]: https://www.manning.com/books/build-a-reasoning-model-from-scratch
[Sebastian Raschka]: https://www.sebastianraschka.com/
[LLM from Scratch]: https://www.manning.com/books/build-a-large-language-model-from-scratch
[Giles Thomas]: https://gilesthomas.com/
[blog post series]: https://www.gilesthomas.com/llm-from-scratch
[Why do OpenAI's GPT-2 weights beat mine]: https://www.gilesthomas.com/2026/07/why-do-openai-gpt2-weights-beat-mine-1-intro
[I found out]: https://magazine.sebastianraschka.com/p/understanding-reasoning-llms
[eventually noticed]: https://substack.com/@rasbt/note/c-177517593
[chapter 4]: https://github.com/rasbt/reasoning-from-scratch/blob/main/ch04/01_main-chapter-code/ch04_main.ipynb
[let's think step-by-step]: https://arxiv.org/abs/2205.11916

# 🤖 Raging against EdenAI

Speaking of LLMs and all things AI, I've recently begun using [EdenAI] as an EU alternative to [Open
Router] --- I know, OpenRouter have EU based servers, but I was attracted to EdenAI's position on
[ZDR] and their [EU endpoint].

I found out at the end of last week that I was unable to buy more credits from EdenAI, with their
website simply reporting that the transaction had failed. Their chatbot (yep) told me that somebody
would get back to me after the weekend.

Wonderful.

Back to OpenRouter until I hear from them on Monday.

Come 5pm on Monday (today) I get the following email from EdenAI:

> Due to an unusually high number of fraudulent payment attempts over the past few days, we have
> temporarily introduced additional security measures for small payments during certain time
> periods.

I guess the "security measures" are to just stop accepting payments without warning, and the
"certain time periods" are when I want to make a payment. Clever.

Well, I'm sure that solo developer accounts are of little importance or value to EdenAI, what with
them being only _small payments_. Of course, I'm sure they could have sent out a message explaining
that there would be some "additional security measures" (whatever that means), but no doubt I, being
only a single developer, was beneath their notice.

I mean, it's not like I'm going to make any decisions about which company to use for routing in a
larger organisation at any point in the future, right? You know, where I might not want to pick a
business that just stops accepting payments without any notice, so anything that relies on their
service just stops working. No no, by all means just silently stop accepting _small payments_ during
certain (unspecified) time periods.

So it's back to OpenRouter for now.

[EdenAI]: https://www.edenai.co/
[Open Router]: https://openrouter.ai/
[ZDR]: https://www.edenai.co/docs/v3/data-governance/provider-data-policies
[EU endpoint]: https://www.edenai.co/docs/v3/data-governance/eu-endpoint
