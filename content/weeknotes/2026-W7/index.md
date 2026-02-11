---
date: 2026-02-15T16:55:00
summary: New music and films, Discord disappointment, and LibreChat.
---

I have come to really enjoy the weeknotes from people like [Robb Knight], [Stephen Gower], [Joel],
and [Noisy Deadlines]. I've been thinking about starting my own weeknotes and, after one thing or
another, I've finally managed to start. Only took up to week 7 to get going 🙄

[Robb Knight]: https://rknight.me/blog/tags/weeknotes/
[Stephen Gower]: https://srgower.com/archive/
[Joel]: https://joelchrono.xyz/tags/weeknotes
[Noisy Deadlines]: https://noisydeadlines.net/tag:weeknotes

# Physical Media Acquisition Continues

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

# Reading

There's been a few things I've read this week that you might find interesting.

- [Have I hardened against LLMs?] by Baldur Bjarnason.
- [My experience with vibe coding] by Gabriella Gonzalez (who brought us cool stuff like [Dhall] and
  the [pipes] library). Gabriella's findings are much the same as many of us, but it's excellent to
  have such details available.
- The [European Open Source AI Index] has placed [Proton's Lumo] at the bottom of their list of open
  generative AI models. Even Grok isn't quite in last place. They have a [blog
  post](https://osai-index.eu/news/lumo-proton-least-open/) about the matter (_2025-08-29_).
  - Proton's "open source" position has always been more marketing than actual openness.
  - Where's my Linux client for Proton Drive? Of course, go ahead and make another chat wrapper
    around an LLM, Proton.
- Speaking of Proton, the [ProtonVPN] app for Linux seems to be a Gtk application. Whilst I'm very
  happy to see that it's not another blasted Electron app, I'm not sure that I'm entirely happy with
  it being entirely written in Python. But I'll take what I can get.
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
    and insidious to be so easilly mitigated. For example, document retrieval systems that exhibit
    exclusionary norms, even under neutral queries, mitigated using classification models that
    exhibit those same biases.
  - Whilst _Health and Wellness_ engagement [may well be beneficial], I still believe we must be
    mindful to balance all risk dimensions when engaging with LLMs. Let's not steer away from one
    risk so sharply we inadventently contribute to another: automating the reinforcement of systems
    of inequity.
  - There are likely yet more risks that we have yet to recognise.

[My experience with vibe coding]: https://haskellforall.com/2026/02/my-experience-with-vibe-coding
[Dhall]: https://dhall-lang.org
[pipes]: https://hackage.haskell.org/package/pipes
[Have I hardened against LLMs?]: https://www.baldurbjarnason.com/2026/have-i-hardened-against-ai/
[Proton's Lumo]: https://proton.me/en/lumino
[European Open Source AI Index]: https://osai-index.eu/database
[ProtonVPN]: https://github.com/ProtonVPN/proton-vpn-gtk-app/tree/stable
[on the effects of the menopause]: https://theconversation.com/menopause-our-study-revealed-how-it-affects-the-brain-cognition-and-mental-health-275329
[HRT links to depression]: https://theconversation.com/menopause-hrt-linked-to-depression-heres-what-the-evidence-actually-says-194284
[2601.15645]: https://arxiv.org/abs/2601.15645
[may well be beneficial]: https://www.swissre.com/reinsurance/life-and-health/l-h-risk-trends/health-and-wellness-engagement-impacts.html
