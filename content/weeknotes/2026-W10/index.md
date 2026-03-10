---
date: 2026-03-10T13:14:00
summary: A late week note, laptop envy, and the cheapest car service
coverImage:
  author: Evgeny Tchebotarev
  url: https://www.pexels.com/photo/close-up-photo-of-cherry-blossom-2187458/
---

This weeknote is late, as I've been busy this weekend working on a new project that has literally
consumed all available free time to the exclusion of almost everything else. Even rationality has
been driven entirely from this house to be replaced by frantic scribbling. I'll get over it soon,
and put the project on the shelf next to all the others.

Apart from the mad new project, this week has been pretty quiet. I've been fairly busy at work doing
some data analysis, which is always time consuming and kind of dull. I often end up running into two
main blockers to progress on data analysis: ideas and articulation. I sometimes find myself starting
at a pile of tables and CSV files and think "_how am I going to get anything meaningful from all
this?_". And then, once I've thought through and implemented what I wanted to explore, I then have
to actually articulate my findings. Always with the nagging feeling that I've missed something.
"*Just ask an AI what you should do!*" -- oh, FFS 🙄

# New Side Door

I got a new side door installed on the garage this week. The old door was in a shocking state, and
had become almost impossible to open. I won't include a picture, because it's literally just a door.

I did ask them to install a limiter that stops the door opening further than ninety degrees. What I
didn't realise is that the limiter can be disconnected from the door frame and tucked away into the
top of the door.

# 💻 Laptop Envy

Ruben has [bought a new ThinkPad](https://rubenerd.com/buying-a-new-thinkpad-for-the-first-time/),
which has left me with feeling of laptop envy. Since moving my daily driver from an M3 MacBook in a dock to a
Linux PC, I've been feeling much better being back on Linux with KDE. The years daily driving a Mac,
prompted by the release of the M1, have been fun, but I wanted to get back to using Linux as my main
machine. This has, of course, meant that I'm feeling the friction between my main Linux machine and
the M1 laptop that I still use when not at my desk.

Ruben's purchase of a new ThinkPad got me thinking about possibly changing out the M1 MacBook for
something more suitable for running Linux. Would a ThinkPad be a good candidate?

{{< figure src="lenovo-laptops.png" width=568 enlarge=true title="Lenovo ThinkPad E14 Gen 7 Laptops" >}}

This is difficult for me: I really do like the MacBook -- it's build and design are pleasant, and
the ~20 hour battery life is fantastic.


# 🚗 Car Service

I had to take the car in to be serviced on Wednesday. I think it was about a year since its last
service. The car has been complaining since its MOT about needing an oil change, and occasionally
there was a tire pressure error. I took it to Audi, who gave it a look over and told me it didn't
actually need a service, as I'd only driven it ~3k miles since I bought it from them a year ago. So
they gave the car a spruce up and sent me home, which was very nice of them.

# Readeck 0.22.0

A new release of [Readeck] arrived this week: [Readeck 0.22.0]. I happened to check the releases
page mere seconds after their release had been published, at about half eight in the morning for me.

I was unreasonably exciting to try out the new release, which now adds annotations to highlights. I
can now add a comment along with a highlight, which is _very_ useful, as I often look back at
highlights and wonder what I was thinking about when I made them.

{{< figure src="adding-notes-to-highlights.png" width=515 enlarge=true title="Adding a note to a highlight in Readeck" >}}

> [!TIP]
> I also discovered, quite by accident, that I can edit the note for a highlight by
> double-clicking on the highlight in the main document view.

This new feature in Readeck prompted me to update my tool that exports highlights from Readeck to
[Obsidian] to include any notes that I've added to the highlights.

{{< figure src="notes-exported-to-obsidian.png" width=678 enlarge=true title="Notes exported with highlights into Obsidian" >}}

I was very excited about this, as it means I can include notes and links to other notes, just like I
do with Zotero.

{{< figure src="notes-from-zotero-example.png" width=669 enlarge=true title="An example of a highlight and note from Zotero with a link to a different page in Obsidian" >}}

# 🤖 OpenCode, OpenRouter and Kimi K2.5

In my unfortunately inevitable and interminable experiments with LLMs, I typically use [OpenRouter]
as my model provider. OpenRouter generally makes it easier to interact with a diverse set of models
by avoiding the need to juggle a multitude of keys and APIs. Whilst the latter is becoming less of a
problem as time goes on, the former still remains a nuisance. This is especially true when it comes
to running models that are larger than I have hardware for. For more expansive experiments with
"open weight" models, I will often spin up something on [Lambda], but for general use and
small-scale experiments, I still find OpenRouter to be very useful.

I've been aware that OpenRouter keep [rankings of apps and agents], although I've mostly ignored it.
But I did discover this week that you can filter the ranking of models by application, and that
includes applications that they don't "feature" on the main list of applications. This led me to
discover that, for [OpenCode], the [second-most popular model] is actually [Kimi K2.5], with 156B of
the 1.31T total tokens (at the time of taking this screenshot).

{{< figure src="opencode-kimi-k2.png" width=500 enlarge=true title="Top models used on OpenRouter with OpenCode" >}}

I thought this was quite interesting, as I really assumed that the top models would be all Claude
variants, just like it is for [Claude Code]. Also, whilst OpenCode ranks #5 in terms of tokens
(1.31T), it doesn't appear in the list of top coding agents on OpenRouter's website. Clearly this is
a conspiracy by OpenRouter 😏


[Readeck]: https://readeck.org/
[Readeck 0.22.0]: https://codeberg.org/readeck/readeck/releases/tag/0.22.0
[Obsidian]: https://obsidian.md/
[OpenRouter]: https://openrouter.ai/
[Lambda]: https://lambda.ai/
[rankings of apps and agents]: https://openrouter.ai/apps
[OpenCode]: https://opencode.ai/
[second-most popular model]: https://openrouter.ai/apps?url=https%3A%2F%opencode.ai%2F
[Kimi K2.5]: https://huggingface.co/moonshotai/Kimi-K2.5
[Claude Code]: https://openrouter.ai/apps?url=https%3A%2F%2Fclaude.ai%2F
