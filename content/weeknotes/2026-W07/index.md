---
date: 2026-02-15T16:55:00
summary: New music and films, Discord disappointment, and LibreChat.
---

> [!success] This is the first weeknote
>
> I have come to really enjoy the weeknotes from people like [Robb Knight], [Stephen Gower], [Joel],
> and [Noisy Deadlines]. Last year I wasbeen thinking about starting my own weeknotes, and I decided
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
a Blu-ray. Buying blu-rays new, with some of them costing nearly £20, is still too expensive. So
I'll be scraping the second-hand market for the foreseeable future.

{{< figure src="discs-on-the-table.jpg" width=800 title="Some Blu-rays and DVDs on my kitchen table" >}}

Whilst replacing the films has gone quite well so far, some of the TV shows are proving much harder
or more expensive to replace. For example, the [Trollhunters: Tales of Arcadia] DVD seen above was
somewhat more expensive than the others. Even more frustrating is that some of the TV shows, like
the second and third seasons of Trollhunters, were never published to DVD or Blu-ray 😡

[Obsidian]: https://obsidian.md
[World of Books]: https://www.worldofbooks.com
[Trollhunters: Tales of Arcadia]: https://en.wikipedia.org/wiki/Trollhunters:_Tales_of_Arcadia

# 🎶 New Music

I've been chasing new albums again, and found a few more of interest!

- [The Outsider] by Old Sorcery
- [Home] by Vesseles
- [Heritage] by Structure
- [Elevation] by Enshine
- [The Regeneration Itinerary] by ...And Oceans
- The [Cairn OST] by Marting Stig Andersen, Gildaa, and The Toxic Avenger. This is the OST for the
  awesome game [Cairn] from the Game Bakers. I've just started playing Cairn, and I'm utterly
  terrible at it. The soundtack is really quite lovely.

[The Outsider]: https://oldsorcery.bandcamp.com/album/the-outsider
[Home]: https://vesseles.bandcamp.com/album/home
[Heritage]: https://structure-doom.bandcamp.com/album/heritage
[Elevation]: https://enshine.bandcamp.com/album/elevation
[The Regeneration Itinerary]: https://andoceans.bandcamp.com/album/the-regeneration-itinerary
[Cairn OST]: https://cairn-game.bandcamp.com/album/cairn-original-soundtrack
[Cairn]: https://www.thegamebakers.com/cairn/

# 🚀 RocketChat: Replacement for Discord?

Discord have decided that they're going to require age verification [for all users]. They now claim
that they're not going to be collecting any sensitive information from users. I [complained about
this] earlier in the week, and I just can't bring myself to hand over identity to Discord. This
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

If you're looking for an alternative to Discord, there's a useful [list of alternatives] ranked by
functionality, security, openness, safety, and decentralisation.

It seems that somebody has already [made a script] to circumvent the age verification.

[for all users]: https://www.bbc.co.uk/news/articles/c1d67vdlk1ko
[complained about this]: /notes/2026-02-12
[Teen by Default]: https://discord.com/press-releases/discord-launches-teen-by-default-settings-globally
[Rocket.Chat]: https://www.rocket.chat/
[Jitsi]: https://jitsi.github.io/handbook/docs/architecture/
[require registration]: https://docs.rocket.chat/v1/docs/register-your-workspace
[list of alternatives]: https://taggart-tech.com/discord-alternatives/
[made a script]: https://age-verifier.kibty.town/

# 📚 Reading

There's been a few things I've read this week.

- [Have I hardened against LLMs?] by Baldur Bjarnason.
- [Turing Post interview with Nathan Lambert].
- [The Future was Federated]
- [Have I hardened against LLMs?] by Baldur Bjarnason.
- [My experience with vibe coding] by Gabriella Gonzalez. The same Gabriella who brought us cool
  stuff like [Dhall] and the [pipes] library.
  - Gabriella's findings are much the same as many of us: vibe-coding is not worthless, but needs a
    lot of improvement.
  - She includes the entire transcript of the session, which is very helpful.
- I read a Conversation article about some new research [on the effects of the menopause]
  (_2026-02-10_). The researchers mention that they found that women using HRT showed higher levels
  of anxiety and depression compared to those who never used HRT. They went on to state that this is
  suggestive of pre-existing mental health problems.
  - This reminded me of a previous article on [HRT links to depression] (_2022-11-11_), that helped
    mitigate some of the misinformation that was spreading about HRT at the time. Again.
- I finally got around to reading [2601.15645]: _Towards Reliable Medical LLMs: Benchmarking and
  Enhancing Confidence Estimation of large language Models in Medical Consultation_.
  - I'm still not convinced that we've yet addressed all the risks associated with the use of LLMs
    in a clinical or clinically-adjacent setting. Putting aside the oft discussed risks of
    hallucinations, I think the significant risk of LLMs perpetuating and amplifying social biases
    still remains unmitigated. Moreover, I remain convinced that such biases are far too entrenched
    and insidious to be so easily mitigated.

[Have I hardened against LLMs?]: https://www.baldurbjarnason.com/2026/have-i-hardened-against-ai/
[Turing Post interview with Nathan Lambert]: https://www.turingpost.com/p/nathanlambert
[The Future was Federated]: https://news.dyne.org/the-future-was-federated/
[My experience with vibe coding]: https://haskellforall.com/2026/02/my-experience-with-vibe-coding
[Dhall]: https://dhall-lang.org
[pipes]: https://hackage.haskell.org/package/pipes
[Have I hardened against LLMs?]: https://www.baldurbjarnason.com/2026/have-i-hardened-against-ai/
[Proton's Lumo]: https://proton.me/en/lumino
[European Open Source AI Index]: https://osai-index.eu/database
[on the effects of the menopause]: https://theconversation.com/menopause-our-study-revealed-how-it-affects-the-brain-cognition-and-mental-health-275329
[HRT links to depression]: https://theconversation.com/menopause-hrt-linked-to-depression-heres-what-the-evidence-actually-says-194284
[2601.15645]: https://arxiv.org/abs/2601.15645

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
  Whilst I'm very happy to see that it's not another Electron app, I'm not sure that I'm entirely
  happy with it being completely written in Python. But I'll take what I can get.

[ProtonVPN]: https://github.com/ProtonVPN/proton-vpn-gtk-app/tree/stable
