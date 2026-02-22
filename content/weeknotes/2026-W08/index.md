---
date: 2026-02-22T19:15:00
summary: IRCv3 and Escaping Capitalism
coverImage:
  author: Lum3n
  url: https://www.pexels.com/photo/green-pine-trees-covered-with-fogs-under-white-sky-during-daytime-167699/
---

# 💬 IRCv3

I've been continuing in my attempts to find an alternative to Discord after their [recent decision] to force us
all to submit to age verification. [Last week] I started building an installation of [Rocket.Chat],
but that has somewhat stalled.

This week I saw a [post] by [@whitequark@treehouse.systems] on Mastodon, in which they describe many of
the new advances in IRCv3. I had no idea that IRC had even been adding updates to its protocol, so I
was very curious. Certainly in my friend group it seems that nostalgia for IRC is still quite
strong. Some of the advances that IRCv3 brings that I think are most interesting to me are:

- When joining a channel, you get a backlog of messages that you haven't read yet. This is pretty
  much one of two important reason to maintain an [IRC bouncer] back in the day.
- Multiple clients can connect to the same server, using the same account. This addresses the second
  reason to maintain an IRC bouncer. I used to run my IRC client in a [screen] session on a UNIX
  [shell account] so it remained connected to the server. I've also used [ZNC], which was a bit more
  complex, but allowed me to have multiple clients.
- Your nick remains in the channels you join, even if you're disconnected. You're just marked as
  away. People can then DM you, and you'll see the messages when you reconnect.

So on Sunday morning --- actually this morning as I write these weeknotes --- I decided to install
an IRCv3 server. I decided to go with [Ergo], which was quite reasonable to set up in Docker. I've
also added [The Lounge] (strange name choice, I know), which is a web-based IRC client for people
who don't want to set up a client.

{{< figure src="the-lounge.png" width=400 enlarge=true title="The Lounge interface in Firefox" >}}

To access the server from my phone I've set up [Igloo] (available for Android and iOS), and having
the phone and desktop connected to the same IRC server without a bouncer is a revelation! I like the
interface being so simple, and the use of a monospace font.

{{< figure src="igloo-iphone.png" width=400 title="Igloo running on my iPhone. Such a quite channel 😁" >}}

On the desktop I've set up [Halloy] as [Irssi], my IRC client of choice for the past couple of
hundred years, hasn't adopted much of the IRCv3 features. Halloy seems to support quite of lot of
IRCv3 features, and is built using the [iced] GUI framework, which is interesting.

{{< figure src="halloy-desktop.png" width=400 enlarge=true title="Halloy running on my desktop." >}}

Having a [Catppuccin] theme for Halloy is certainly a good way to get my interest 😏.

[recent decision]: /notes/2026-02-12/
[Last week]: /weeknotes/2026-W07/
[Rocket.Chat]: https://rocket.chat/
[post]: https://social.treehouse.systems/@whitequark/116089585784234453
[@whitequark@treehouse.systems]: https://social.treehouse.systems/@whitequark
[IRC bouncer]: https://en.wikipedia.org/wiki/IRC_bouncer
[ZNC]: https://wiki.znc.in/ZNC
[screen]: https://www.gnu.org/software/screen/
[shell account]:https://sdf.org/
[Ergo]: https://github.com/ergochat/ergo
[The Lounge]: https://thelounge.chat/
[Igloo]: https://igloo.app/
[Halloy]: https://halloy.chat/
[iced]: https://github.com/iced-rs/iced/
[Catppuccin]: https://catppuccin.com/
[other themes]: https://themes.halloy.chat/

# 🎶 New Music

After scouring the latest posts on [Angry Metal Guy], I have found a few new albums that I've really
been enjoying. Several of these came from AMG's [Stuck in the Filter: Nov/Dec 2025] post. I'm
finding quite a few of my favourite albums in these "_Stuck in the Filter_" posts.

- [Desoration - NON] --- Some fun melodic death metal from New Zealand. I think this is only their
  second album. Very impressive.
- [Brainblast - Colossus Suprema] --- More fun melodic death. I think this is only _Brainblast_'s
  third album, and they're really doing great stuff. If you throw an evolution stone at them they
  might change into a new _Blind Guardian_.
- [Gods of Gaia - Escape the Wonderland] --- Time for some symphonic death metal. This is probably
  the more epic of these albums, and the one I've played the most this week. I really do enjoy the
  symphonic and melodic stuff, ever since I first got hooked on power metal as a teenager with
  [Rhapsody's Rain of a Thousand Flames]. I think [Rise Up] is proving to be my favourite song on
  this album.
- [Bizarrekult - Alt Som Finnes] --- Another great death metal album from Bizarrekult. I think
  [Avmakt] is my favourite song on this album.
- [AngelMaker - This Used to be Heaven] --- More melodic deathcore. I really am starting to worry I
  might actually like deathcore, especially after [last year's album of the year] was by _Orbit
  Culture_, another deathcore band. And 2024 would probably have been _Assemble the Chariots'_ album
  [Unyielding Night] -- yet more deathcore. I'm probably coming down with something. Anyway, I quite
  like the two-part track _The Omen_, comprising [Part 1: Prophecy] and [Part 2: Acquiesce].
- [Hounds of Bayanay - KEM] --- An awesome folk-metal album from _Hounds of Bayanay_. This band has
  track names that can't render properly in my browser, which is fun (see below).
- [Shylmagoghnar - Emergence] --- And yet more melodic death. This is a great album, with some
  excellent tracks. I think my favourite is [A New Dawn].

{{< figure src="bayanay-render-errors.png" width=400 title="Hounds of Bayanay track names can't render properly in my browser" >}}

[Angry Metal Guy]: https://www.angrymetalguy.com/
[Stuck in the Filter: Nov/Dec 2025]: https://www.angrymetalguy.com/stuck-in-the-filter-november-december-2025s-angry-misses/
[Desoration - NON]: https://desoration.bandcamp.com/album/non
[Bizarrekult - Alt Som Finnes]: https://bizarrekult.bandcamp.com/album/alt-som-finnes
[Avmakt]: https://bizarrekult.bandcamp.com/track/avmakt
[AngelMaker - This Used to be Heaven]: https://angelmaker.bandcamp.com/album/this-used-to-be-heaven
[last year's album of the year]: /blog/album-of-the-year-2025/#-orbit-culture---death-above-life
[Unyielding Night]: https://assemblethechariots.bandcamp.com/album/unyielding-night
[Part 1: Prophecy]: https://angelmaker.bandcamp.com/track/the-omen-part-i-prophecy
[Part 2: Acquiesce]: https://angelmaker.bandcamp.com/track/the-omen-part-ii-acquiesce-feat-ben-duerr
[Brainblast - Colossus Suprema]: https://brainblastofficial.bandcamp.com/album/colossus-suprema
[Gods of Gaia - Escape the Wonderland]: https://godsofgaia.bandcamp.com/album/escape-the-wonderland
[Rise Up]: https://godsofgaia.bandcamp.com/track/rise-up
[Hounds of Bayanay - KEM]: https://houndsofbayanay.bandcamp.com/album/kem
[Shylmagoghnar - Emergence]: https://shylmagoghnar.bandcamp.com/album/emergence
[Rhapsody's Rain of a Thousand Flames]: https://rhapsody.bandcamp.com/album/rain-of-a-thousand-flames
[A New Dawn]: https://shylmagoghnar.bandcamp.com/track/a-new-dawn

# 📚 Reading

I've been reading things again.

{{< book
    url="https://www.penguin.co.uk/books/468201/escape-from-capitalism-by-mattei-clara-e/9780241742181"
    cover="cover-escape-from-capitalism.webp"
    title="Escape From Capitalism: Science and Economics Etc Longer Title"
    subtitle="Economics is Political, and Other Liberating Truths"
    author="Clara E. Mattei"
    year="2026"
    rating=5 >}}
Economics is sold as pure and apolitical: scientific, neutral, exact. This urgent book exposes its
true role: to convince us there’s no alternative to capitalism. We live in a world dominated by the
dogma that austerity is necessary, unemployment natural, endless wars inevitable and central banks
all-powerful. It doesn't have to be this way.

In her bold, ground-breaking manifesto, economist Clara E. Mattei tears the mask off our economic
system. She unpacks key concepts like growth, inflation, unemployment and balanced budgets to show
how they’re used to enforce market dependence, not freedom, stripping us of the power to shape the
democratic decisions that govern our daily lives. Enduring problems such as poverty and inequality
are not accidents or bugs in the economy, but core features – justified with pseudoscientific models
to support a system that unfairly rewards people with the most resources. {{< /book >}}

[Clara Mattei]'s new book [Escape from Capitalism] arrived on Friday, and I completely devoured it
over the course of the afternoon and into the early evening. It's a really great book. Clara
Mattei, a Professor of Economics at The University of Tulsa, paints a terrifying picture of the
state of the world under capitalism.

I first heard Clara Mattei in her [interview with Channel 4], in which she is magnificently
eloquent in her critique of capitalism and its irrationality. So I was quick to order a copy of
her book, and I'm very glad I did.

The book proceeds with a concise explanation of what Mattei calls the "capital order". She
describes how there are two classes: the _capital class_ who control the means of production and
own the capital that is invested into that production, and the _working class_ who must sell their
labour for a wage. The latter, which encapsulates nearly all of us, must sell our capacity to work
for significantly less than it is worth due to our lack of access to the means of production, and
subsequently have no claim over what we have produced.

Mattei then goes on to describe how austerity is a tool of capitalism to increase the amount of
capital that is moved from the working class to the capital class. She then explains how
unemployment is not only a product of the capitalist system, but also vital to its maintenance.

Chapter 4, entitled "_The West Over the Rest_" is a really depressing chapter. She covers the lie
that the Western path to development could be adopted by any other nation, and that the key to doing
so is to adopt capitalism. And when those improvements don't manifest, the cause is institutional
deficiencies. Moreover, the horrendous exploitation of the rest of the world by the Western
economies is a key source of wealth in the US and Europe. Mattei then corroborates this with several
increasingly grim statistics and examples of this exploitation at work, explaining how various
Western institutions are used to maintain this dependency.

> Technocratic institutions such as the International Monetary Fund (IMF) and the World Bank fortify
> a relationship of dependency. In June 2024, Gana took out its eighteenth IMF loan since
> independence, all of which were conditional on strict austerity.

This process of lending, mandating austerity, forcing countries to sell their national assets and
deregulate their markets, ultimately leads to economic collapse and debt defaults. Even the helping
hand of aid is a form of dependency.

> Western governments boast about aid to so-called developing countries, but humanitarian aid is a
> facade. Many empirical studies confirm that \[..] more money flows out of Africa than goes in.
> The most impoverished continent is a "net creditor" to the rest of the world. In 2015, African
> countries received $162 billion, mainly in loans, aid, and personal remittances. But in the same
> year, $302 billion was taken from the continent \[..].

One of the hardest parts of this chapter is the discussion of Israel's control over Palestine, the
west's role in the economic dependence of Palestine, and how, since 1990s Israel has become one of
the world's leading developers of military surveillance technology. Western countries have, of
course, benefited immensely from this.

> Even as they sponsor lavish philanthropic galas, America's biggest banks are cashing in on the
> destruction of human life. Goldman Sachs and Bank of America have poured $7.2 billion and $3.5
> billion respectively into Israeli "war bonds" -- profiting off the massacre of starving
> Palestinians.

The book finishes off with a chapter on the incaompatibilities between democracy and capitalism,
highlighting some of the more successful efforts around the world to transition to a more democratic
and socialist system, which is always interesting to hear about.

[Clara Mattei]: https://www.claramattei.com/
[Escape from Capitalism]: https://www.penguin.co.uk/books/468201/escape-from-capitalism-by-mattei-clara-e/9780241742181
[interview with channel 4]: https://www.youtube.com/watch?v=9M_dq_0ljsc

## How a single typo led to RCE in Firefox {href="https://kqx.io/post/firefox0day/"}

This is great
write-up of a bug in Firefox. I've spent quite a bit of time working on code generation and
garbage collection, so I really enjoy reading about these bugs, having caused a great many myself.
It can be surprisingly easy for a GC to end up in a state where the heap is in an inconsistent
, even if that inconsistency is not entirely obvious.

And I think, in general, bit flags can be really a good way of shooting yourself in the foot.

This reminds me of a similar bug with bit flags and code generation that lead to a lot of debugging
and agony, although luckily not an RCE (that I was aware of). A visual effects product I worked
on, called Halide, had quite a flexible processing pipeline, in which a number of effects could be
arranged as required. Some of these effects required a lot of processing, such as motion-based
[deinterlacing]. To improve the speed of the frame processing, Halide would [JIT] the pipeline in
the background.

This was a billion years ago, when the AMD [Athlon 64] was still awesome and [SSE3] was very
exciting -- the `HADDPS` and `LDDQU` instructions were very handy for video processing -- so we
could achieve quite a speed-up by being a bit smarter about how we used these exciting vector
instructions. Whilst this seems quaint by today's standards, JIT-ing the pipeline meant that
after a couple of seconds Halide's processing speed would increase to the point it could run all
of it's effects over HD footage at broadcast speeds. In product demonstrations, people would think
we were playing a trick with pre-recorded footage.

Anyway, the JIT progressively replaced parts of the pipeline graph with generated or specialised
code, eventually reducing the graph to a single function which represented that particular
arrangement of effects and options. During the processing of the graph, the JIT would mark the
parts of the graph that had passed through the various stages of compilation.

A bug in the marking of some graph nodes meant that the JIT would keep replacing parts of a graph
with newly generated code until it consumed all available memory. This had the effect of slightly
increasing the speed of the effects pipeline, and then slowing everything down until the software
crashed. This particular bug, just like the one in Firefox, was an incorrect bitwise operation
buried in a load of mask operation macros.

[Athlon 64]: https://en.wikipedia.org/wiki/Athlon_64
[SSE3]: https://en.wikipedia.org/wiki/SSE3
[JIT]: https://en.wikipedia.org/wiki/Just-in-time_compilation
[deinterlacing]: https://en.wikipedia.org/wiki/Deinterlacing

## Slopsquatting {href="https://documents.trendmicro.com/assets/white_papers/TechBrief-Slopsquatting.pdf"}

I learned from a [LaurieWired video] (2026-02-18) that a report from [Trend Micro] has come out on a new
phenomenon: [Slopsquatting], where attackers will upload malicious packages to package registries
like NPM and PyPI with names that match those that are hallucinated by coding agents.

This is another example of the rather worrying trend of coding agents being involved, directly and
indirectly, in the development and distribution of malware and the creation of vulnerabilities.
And the rate of package name hallucinations is not small:

> A [comprehensive study] (2024-06-12) examining 576,000 Python and JavaScript code samples from
> 16 models found that commercial LLMs hallucinated dependencies at a rate of roughly 5%, while
> open-source counterparts exhibited rates exceeding 21.7% — yielding over 205,000 unique phantom
> package names.

Laurie also talks about new developments in [CXL]-connected memory, including Intel's [demo]
(2025-11-12) of a 5.6 TB shared memory pool accessible by a group of servers. This reminds me of
Felicitas Pojtinger's [r3map]: _Remote mmap: High-performance remote memory region mounts and
migrations in user space._ Great fun.

[Trend Micro]: https://www.trendmicro.com/
[LaurieWired video]: https://www.youtube.com/watch?v=cnX5zJ_qGz0
[Slopsquatting]: https://documents.trendmicro.com/assets/white_papers/TechBrief-Slopsquatting.pdf
[comprehensive study]: https://arxiv.org/abs/2406.10279
[CXL]: https://en.wikipedia.org/wiki/Compute_Express_Link
[demo]: https://computeexpresslink.org/blog/intel-sc25-demo-4245/
[r3map]: https://github.com/pojntfx/r3map

