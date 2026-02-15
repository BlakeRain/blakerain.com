---
date: 2026-02-15T16:25:00
summary: New music and films, Discord disappointment, and LibreChat.
coverImage:
  author: Ronalds
  urL: https://www.pexels.com/photo/trees-on-snow-covered-ground-6553833/
---

> [!success] This is the first weeknote
>
> I have come to really enjoy the weeknotes from people like [Robb Knight], [Stephen Gower], [Joel],
> and [Noisy Deadlines]. Last year I was thinking about starting my own weeknotes, and I decided
> to start them in 2026. After one thing or another, I've finally managed to get going. Only took up
> to week 7 🙄

[Robb Knight]: https://rknight.me/blog/tags/weeknotes/
[Stephen Gower]: https://srgower.com/archive/
[Joel]: https://joelchrono.xyz/tags/weeknotes
[Noisy Deadlines]: https://noisydeadlines.net/tag:weeknotes

# 💿 Physical Media Acquisition Continues

Since last year I've been focusing more strongly on distancing myself from most streaming services
and "big tech" in general. One way I've been doing this is by replacing my streaming purchases of
films and TV shows with physical media. This has mostly involved a monthly scan through a checklist
in [Obsidian] of all the films and TV shows that I want to acquire, and then looking for deals on
eBay and [World of Books]. So far I've managed to find some good deals, some going as low as £2 for
a Blu-ray. Buying Blu-rays new, with some of them costing nearly £20, is still too expensive. So
I'll be scraping the second-hand market for the foreseeable future.

{{< figure src="discs-on-the-table.jpg" width=800 title="Some Blu-rays and DVDs on my kitchen table" >}}

Whilst replacing the films has gone quite well so far, some of the TV shows are proving much harder
or more expensive to replace. For example, the [Trollhunters: Tales of Arcadia] DVD seen above was
somewhat more expensive than the others. Even more frustrating is that some of the TV shows, like
the second and third seasons of Trollhunters, were never published to DVD or Blu-ray 😡. The
streaming era is leaving some strange gaps.

[Obsidian]: https://obsidian.md
[World of Books]: https://www.worldofbooks.com
[Trollhunters: Tales of Arcadia]: https://en.wikipedia.org/wiki/Trollhunters:_Tales_of_Arcadia

# 🎶 New Music

I've been chasing new albums again, and found a few more of interest!

- [The Regeneration Itinerary] by ...And Oceans. Such a fun album. I really liked [The Terminal Filter].
- The [Cairn OST] by Martin Stig Andersen, Gildaa, and The Toxic Avenger. This is the OST for the
  awesome game [Cairn] from the Game Bakers. I've just started playing Cairn, and I'm utterly
  terrible at it. The soundtrack is really quite lovely.
- [The Outsider] by Old Sorcery
- [Home] by Vesseles
- [Heritage] by Structure
- [Elevation] by Enshine

[The Outsider]: https://oldsorcery.bandcamp.com/album/the-outsider
[Home]: https://vesseles.bandcamp.com/album/home
[Heritage]: https://structure-doom.bandcamp.com/album/heritage
[Elevation]: https://enshine.bandcamp.com/album/elevation
[The Regeneration Itinerary]: https://andoceans.bandcamp.com/album/the-regeneration-itinerary
[The Terminal Filter]: https://andoceans.bandcamp.com/track/the-terminal-filter
[Cairn OST]: https://cairn-game.bandcamp.com/album/cairn-original-soundtrack
[Cairn]: https://www.thegamebakers.com/cairn/

# 🚀 RocketChat: Replacement for Discord?

Discord have decided that they're going to require age verification [for all users]. They now claim
that they're not going to be collecting any sensitive information from users. I [complained about
this] earlier in the week, and I just can't bring myself to hand over my ID to Discord. This
means I'm going to be stuck with a [Teen by Default] account. It's not even clear what this means
specifically: am I going to be removed from some of the servers that I've joined?

> Beginning with a phased global rollout to new and existing users in early March, users may be
> required to engage in an age-verification process to change certain settings or access sensitive
> content. This includes age-restricted channels, servers, or commands and select message requests.

So I've now been going through some options to find a replacement for Discord for my small group of
friends. One of the features we use a lot is voice chat and screen sharing. I've been working on a
deployment of [Rocket.Chat]. It seems that Rocket.Chat relies on [Jitsi] for the WebRTC video
conferencing component. Apparently they [require registration] to use their service, even if you're
self-hosting. I'll have to see what this means for me.

- If you're looking for an alternative to Discord, there's a useful [list of alternatives] ranked by
  functionality, security, openness, safety, and decentralisation.
- It seems that somebody has already [made a script] to circumvent the age verification.
- Soatok has a good article on how [age verification doesn't need to be a privacy footgun].

[for all users]: https://www.bbc.co.uk/news/articles/c1d67vdlk1ko
[complained about this]: /notes/2026-02-12
[Teen by Default]: https://discord.com/press-releases/discord-launches-teen-by-default-settings-globally
[Rocket.Chat]: https://www.rocket.chat/
[Jitsi]: https://jitsi.github.io/handbook/docs/architecture/
[require registration]: https://docs.rocket.chat/v1/docs/register-your-workspace
[list of alternatives]: https://taggart-tech.com/discord-alternatives/
[made a script]: https://age-verifier.kibty.town/
[age verification doesn't need to be a privacy footgun]: https://soatok.blog/2025/07/31/age-verification-doesnt-need-to-be-a-privacy-footgun/

# 📚 Reading

There's been a few things I've read this week, and some of them might be of interest to you. I've
shared some of my thoughts on them too.

- [The Most Dejected I've Ever Felt]: **Harassers Made Nude AI Images of Her, Then Started an
  OnlyFans.** (2026-02-11)
  - It is beyond awful that this is happening, and no action is being taken.
  - I cannot believe that we would produce a tool that could be used for such harm, make no effort
    to avoid that harm, and then promote the tool as aggressively as possible.
  - Kylie Brewer, the subject of the article, said: "_It feels like any remote sense of privacy and
    protection that you could have as a woman is completely gone and that no one cares_". And she's
    absolutely right. Why does it feel like there are no meaningful consequences for the platforms
    enabling this?
- [Have I hardened against LLMs?] by Baldur Bjarnason (2026-02-09).
  - I think Baldur has a lot of good objections to the proliferation of LLMs and other AI
    technologies, and the apparent attitude of the industry towards the harms that are inherent in
    this technology.
  - Many of his objections are quite valid and well defined. For example, concerns about
    hallucinations in Whisper models are detailed in [Investigation of Whisper ASR Hallucinations
    Induced by Non-Speech Audio](https://arxiv.org/abs/2501.11378v1).
  - Baldur's book, [The Intelligence Illusion], is a valuable read that expands on many of the
    objections he raises in his blog posts. Even if you don't agree with all of Baldur's arguments,
    I still think his work must be taken seriously.
- [Turing Post interview with Nathan Lambert] (2026-02-07) is a good read. It's interesting to hear
  what Lambert has to say on the matter of [open weight models].
  - Lambert thinks that academia will need to rely more on open-source models, and that the US needs
    to focus investment on open-source models, in response to China's much greater ecosystem.
  - He points out that closed-source frontier models like Opus 4.5 and GPT-5.2 are superior to open
    source models, which lag behind the frontier by six to nine months. I'm sure we can all agree
    with this, but I think we should also bear in mind how significant it is that these open-source
    models are even coming close.
  - Lambert talks about how pre-training of open-source models has pretty robust infrastructure, but
    that the legal situation is still complex and fraught with risk. On the other hand,
    post-training for open-source models still has a lot of catching up to do, citing the scarcity
    of available datasets as a major obstacle.
- [My experience with vibe coding] by Gabriella Gonzalez (2026-02-02). The same Gabriella who
  brought us cool stuff like [Dhall] and the [pipes] library.
  - Gabriella's findings are much the same as many of us: vibe-coding is not worthless, but needs a
    lot of improvement.
  - She includes the entire transcript of the session, which is very helpful.
- I read a Conversation article about some new research [on the effects of the menopause]
  (_2026-02-10_). The researchers mention that they found that women using HRT showed higher levels
  of anxiety and depression compared to those who never used HRT. They went on to state that this is
  suggestive of pre-existing mental health problems.
  - This reminded me of a previous article on [HRT links to depression] (_2022-11-11_), that helped
    mitigate some of the misinformation that was spreading about HRT at the time.
- I finally got around to reading [2601.15645]: _Towards Reliable Medical LLMs: Benchmarking and
  Enhancing Confidence Estimation of large language Models in Medical Consultation_.
  - The process used by the authors seems to me to be similar to [LLM-as-a-judge]. My concern here
    is that models will often exhibit various biases in their judgements, such as preferring answers
    based on their order, or preferring more verbose answers. Models exhibit bias towards answers by
    models that have a similar architecture to themselves or are from the same family of models --
    the wonderfully named [narcissistic evaluators] ([or are they]?).
  - I’m still not convinced we’ve addressed the risks of using LLMs in clinical or even
    clinically-adjacent settings. Putting aside the oft discussed risks of hallucinations, I think
    the significant risk of LLMs perpetuating and amplifying social biases still remains
    unmitigated. Moreover, I remain convinced that such biases are far too entrenched and insidious
    to be mitigated without some significant change.

[The Most Dejected I've Ever Felt]: https://www.404media.co/grok-nudify-ai-images-impersonation-onlyfans/
[Have I hardened against LLMs?]: https://www.baldurbjarnason.com/2026/have-i-hardened-against-ai/
[The Intelligence Illusion]: https://illusion.baldurbjarnason.com/
[Turing Post interview with Nathan Lambert]: https://www.turingpost.com/p/nathanlambert
[open weight models]: https://en.wikipedia.org/wiki/Open-source_artificial_intelligence
[My experience with vibe coding]: https://haskellforall.com/2026/02/my-experience-with-vibe-coding
[Dhall]: https://dhall-lang.org
[pipes]: https://hackage.haskell.org/package/pipes
[Have I hardened against LLMs?]: https://www.baldurbjarnason.com/2026/have-i-hardened-against-ai/
[Proton's Lumo]: https://proton.me/en/lumino
[European Open Source AI Index]: https://osai-index.eu/database
[on the effects of the menopause]: https://theconversation.com/menopause-our-study-revealed-how-it-affects-the-brain-cognition-and-mental-health-275329
[HRT links to depression]: https://theconversation.com/menopause-hrt-linked-to-depression-heres-what-the-evidence-actually-says-194284
[2601.15645]: https://arxiv.org/abs/2601.15645
[LLM-as-a-judge]: https://arxiv.org/abs/2412.05579
[narcissistic evaluators]: https://arxiv.org/abs/2311.09766
[or are they]: https://arxiv.org/abs/2601.22548

# Random Notes

- A friend of mine has been transitioning to Linux from macOS/Windows. This week he spent a few days
  consecutively on Linux, and has been able to get on with his work. This is quite an improvement,
  and I think the Linux community should be very proud of what they've accomplished.
  - Loudest complaint seemed to be related to accessing Microsoft's Outlook/Office365 email.
    Thunderbird's OWA support is better these days, but it's still not fully functional. His main
    issue appears to be the sheer volume of emails. Switching to using Outlook in the browser has
    helped him avoid the issues with Thunderbird.
  - Imagine if Mozilla actually spent the time working on Thunderbird, rather than [whatever this
    is](https://stateof.mozilla.org/). "_The State of Mozilla: Are you ready to choose your
    future?_" Yes, Mozilla. It's the same future we keep asking for.
- The [European Open Source AI Index] has placed [Proton's Lumo] at the bottom of their list of open
  generative AI models. Even Grok isn't quite in last place. They have a [blog
  post](https://osai-index.eu/news/lumo-proton-least-open/) about the matter (_2025-08-29_).
  - Proton's "open source" position has always been more marketing than actual openness.
  - Where's my Linux client for Proton Drive? Of course, go ahead and make another chat wrapper
    around an LLM, Proton.
- Speaking of Proton, this week I learned that the [ProtonVPN] app for Linux is a Gtk application.
  Whilst I'm very happy to see that it's not another Electron app, I'm not entirely thrilled that
  it’s written in Python. But I’ll take what I can get.

[ProtonVPN]: https://github.com/ProtonVPN/proton-vpn-gtk-app/tree/stable
