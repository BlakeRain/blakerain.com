---
title: I Don't Like Automatic Summarisation
date: 2026-01-23
tags:
  - AI
  - LLM
params:
  numberedHeadings: false
---

A number of services that I've been using have pushed "AI summaries" over the last year or two. In
some cases these AI summaries are being used in place of human-written summaries, such as those
provided in the abstract of a paper. Granted, paper authors may often write their abstracts in such
a way to boost their chances of acceptance, but I'd rather crash into exaggerated claims than have
to deal with outright misrepresentations.

<!--more-->

One example of this is a tool called [Readwise Reader]. I used to use this for as my reading list,
befre I moved over to [Readeck], which is a similar and, above all, _self-hosted_ alternative.
Whilst Reader was far from the worst offender, and offered plenty of opportunities to _disable_ the
AI summaries, it was just another example of companies pushing "AI" into everything they can.

[Readwise Reader]: https://readwise.io/read
[Readeck]: https://readeck.org/en/

And it really does seem that the only "AI" that these LLMs are used for is summarising: summarise
your emails, summarise your meeting transcripts, summaries your notes. Let's summarise everything in
our lives into as few words as possible, and just live life skimming over the lowest entropy
representation of ourselves until we compleetly regress to the mean in all aspects of our lives.

A while ago I read [The Timmy Trap] by Scott Jenson. I liked how Jenson demonstrates our tendency to
anthropomorphise inanimate objects, and how this now applies LLMs. One thing that he said that stuck
with me was that LLMs _shorten_ rather than _summarise_.

> We don’t just treat LLMs like they’re alive; we also see their actions as intelligent. For
> instance, we say they can “summarize” a document. But LLMs don’t summarize, they shorten, and this
> is a critical distinction. A true summary, the kind a human makes, requires outside context and
> reference points. Shortening just reworks the information already in the text.

Where I think I've seen the worst of this is in automatic summarisation of published research. I've
known a few people to use LLMs to summarise publications and, as mentioned above, several of the
tools I relied on started pushing  automatic summaries.

## Hallucination {#hallucination}

I think the problem I have found to be most frustrating is relying on the summarisation of
publications by language models that subsequently hallucinate. One recent example of this was in the
automatic summarisation of the paper [AI-exposed jobs deteriorated before ChatGPT]. Here is part of
an AI summary of the paper:

> The study analyzes the impact of large language models (LLMs) on labor markets using a combination
> of econometric modeling and natural language processing techniques. It examines unemployment rate
> changes across U.S. states correlated with LLM development timelines and AI job displacement risk
> assessments.
>
> **Key Results**
>
> - LLM advancements correlate with increased unemployment risk in tech and service sectors
> - States with higher AI adoption rates show 15-20% greater job displacement effects
> - Remote work growth mitigates some negative labor market impacts

This information is presented as part of the _AI Key Findings_ for this paper, along with other
important sounding headings like _Methodology_ and _Significance_:

{{< figure src="arxivlens-misrepresenting-paper.png" title="Screenshot of an incorrect summary of a paper" >}}

This summary was suprising to me, as I knew that the abstract of the paper told a different story:

> Public debate links worsening job prospects for AI-exposed occupations to the release of ChatGPT
> in late 2022. Using monthly U.S. unemployment insurance records, we measure occupation- and
> location-specific unemployment risk and **find that risk rose in AI-exposed occupations beginning
> in early 2022, months before ChatGPT**. Analyzing millions of LinkedIn profiles, we show that
> graduate cohorts from 2021 onward entered AI-exposed jobs at lower rates than earlier cohorts,
> with gaps opening before late 2022. Finally, from millions of university syllabi, we find that
> graduates taking more AI-exposed curricula had higher first-job pay and shorter job searches after
> ChatGPT. Together, **these results point to forces pre-dating generative AI** and to the ongoing
> value of LLM-relevant education.

Take for instance the "Key Result" regarding remote work growth mitigating some of the negative
labour market impacts. I can't find any reference at all to remote work in the paper, let alone any
effect it might have. Nor could I find any significant discussion around different states AI
adoption rates. The only paragraph in the paper that I think might relate to these two results are
the following:

> While these patterns hold nationally, a small number of states show post-launch increases in
> computer and math occupation unemployment risk (e.g., CA, WA, and AK; Figs. S15–S12). In  these
> cases, timing alone cannot rule out a contribution from LLM diffusion. However, across  states,
> post-launch unemployment risk remains comparable to pre-pandemic levels, suggesting  limited
> movement in the longer-run equilibrium.

I would hardly consider this one paragraph to be worthy of contributing two of the "key results" of
the paper.

The first key result, which states that "_LLM advancements correlated with increased unemployment
risk \[..]_", seems to be wholly unsupported by this paper. Unless I'm entirely misreading, I hardly
think that statements like the following are consistent with this supposed key result.

> Overall, the timing is inconsistent with a deterioration that begins only after ChatGPT and
> suggests that pre-existing macroeconomic and sectoral forces contributed materially to the
> early-2022 rise in unemployment risk.

The significant detraction from this paper's findings is not all that uncommon. Services that are
pushing "AI summaries" as an alternative, or even as a replacement, for the authors' own abstracts
and summaries, are proving to be quite a problem. I can no longer trust summaries of publications
unless I _know_ that they are not generated by a language model.

Of course, I shouldn't be suprised. Recently the [ACM] got into a spot of bother for their atttempt
to shove AI summaries at us. The reasons for the preference for AI-generated summaries do not seem
to make sense. Are non-technical people paying for premium subscriptions to the ACM? Luckily it
seems that sanity prevailed, and the ACM elected to [move] the AI-generated summaries so that author
abstracts were the default. If you want to know more, Professor [Anil Madhavapeddy] has some great
details in his blog post on the topic.

[ACM]: https://dl.acm.org/
[Anil Madhavapeddy]: https://anil.recoil.org/notes/acm-ai-recs
[move]: https://social.sigsoft.org/@JonathanAldrich/115737714944382593

## Missing Significant Lessons {#missing-significant-lessons}

Putting aside the problem of hallucination for now, I think there are more human issues with relying
on summaries of potentially detailed and technical content, regardless of whether the summaries are
generated by language models or not.

1. I think the details often matter a lot more than the outcome. After all, we don't often publish
   just abstracts and conclusions. Whilst summarisation may tend to preserve outcomes, I worry it
   may often destroy salient load-bearing details. A way to understanding something is to follow the
   journey that the authors took to get to their conclusions. I think this will be lost of we become
   overreliant on automatic summaries.
1. Key features of an publication might be found in the subtext or structure of the publication,
   rather than the surface content. For example, an author might choose to defend one aspect more
   than another. There may be asymmetries in the care and attention given to different ideas. Even
   tonal shifts can carry significance. Language models may be trained to optimise for what is said,
   rather than why and how.

I think when we summarise, especially using a language model, we should be more aware of what we are
losing.

When I read something, I often find that some of the most impactful lessons are within the body of
the publication. A recent example of this was a paper called [Behind the Headline Number: Why Not to
Rely on Frey and Osborne's Predictions of Potential Job Loss from Automation]. The paper is about
issues with Frey and Osborne's predictions of potential job loss from automation in [The future of
employment: How susceptible are jobs to computerisation]. Here's a sentence from the end of the
abstract:

> Compared to standard approaches which classify jobs based on their intensity in routine tasks,
> Frey-Osborne's predictions do not 'add value' for forecasting the impact of technology on
> employment.

This is fine for a summary, and we can fairly understand the outcome of the paper. But I didn't find
that to be as important as something the author's found along the way. On page 16, towards the end
of the section in which the authors are investigating Frey and Osborne's methods, they discuss the
interpretation of the predictions of Frey and Osborne's model:

> Frey-Osborne (2017, p.266) suggest that: '_...the probability axis in Figure 3 which shows the
> distribution of the probabilities of individual occupations being automated can be seen as a
> rough timeline, where high probability occupations are likely to be substituted by computer
> capital relatively soon_'. Following this logic, Frey-Osborne (2017, p.266-67) then state that the
> U-shaped distribution of probabilities implies '_... two waves of computerisation separated by a
> 'technological plateau'_'

The authors then state an alternative interpretation of the predictions:

> In fact, the U-shaped distribution of probabilities of automation generated by Frey-Osborne **is
> much more likely to be a simple artefact of them having used a Logit model to derive those
> predictions together with the hand-labelling having assigned an even split of occupations between
> being and not being capable of full automation**.

That there might be such a mundane interpretation of the distribution was an important insight for
me. I was moved by the possibility and its implications. In this way, the conclusion of the paper
was actually less useful to me than the lesson to be suspicious of distributional stories that might
just be model artefacts.


[The Timmy Trap]: https://jenson.org/timmy/
[tools]: https://readwise.io/read
[Behind the Headline Number: Why Not to Rely on Frey and Osborne's Predictions of Potential Job Loss from Automation]: https://papers.ssrn.com/abstract=3472764
[The future of employment: How susceptible are jobs to computerisation]: https://doi.org/10.1016/j.techfore.2016.08.019
[AI-exposed jobs deteriorated before ChatGPT]: https://arxiv.org/abs/2601.02554
