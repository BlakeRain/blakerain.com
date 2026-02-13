---
title: I Don't Like Automatic Summarisation
date: 2026-02-03T16:47:38
tags:
  - AI
  - LLM
params:
  numberedHeadings: false
  coverImage:
    author: Kate Holovacheva
    url: https://www.pexels.com/photo/close-up-of-plant-leaves-covered-in-hoarfrost-15684738/
---

I don't like automatic summarisation any more. Especially in the context of technical publications.
I find LLM summaries are often unreliable, and that even accurate summaries often erase salient
elements of the original publication. I think when AI summaries are used in place of human-written
abstracts, they can create a false sense of trust and lead to more harm.

A number of services that I've been using have pushed "AI summaries" over the last year or two. In
some cases these AI summaries are being used in place of human-written summaries, such as those
provided in the abstract of a paper. Granted, paper authors may often write their abstracts in such
a way to boost their chances of acceptance, but I'd rather crash into exaggerated claims than have
to deal with outright misrepresentations.

<!--more-->

And it really does seem that the only "AI" that these LLMs are used for is summarising: summarise
your emails, summarise your meeting transcripts, summarise your notes and pull requests. Let's
summarise everything in our lives into as few words as possible, and just live life skimming over
the lowest entropy representation of ourselves until we completely regress to the mean, [model
autophagy] spreading to people. "_You're not just summarising, you're optimising, and that's rare_"
--- don't forget your emdashes.

[model autophagy]: https://arxiv.org/abs/2307.01850

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

{{< figure src="arxivlens-misrepresenting-paper.png" title="A screenshot of an incorrect summary of a paper. I didn't care enough to capture it entirely." >}}

This summary was surprising to me, as I knew that the abstract of the paper told a different story:

> Public debate links worsening job prospects for AI-exposed occupations to the release of ChatGPT
> in late 2022. Using monthly U.S. unemployment insurance records, we measure occupation- and
> location-specific unemployment risk and **find that risk rose in AI-exposed occupations beginning
> in early 2022, months before ChatGPT**. Analyzing millions of LinkedIn profiles, we show that
> graduate cohorts from 2021 onward entered AI-exposed jobs at lower rates than earlier cohorts,
> with gaps opening before late 2022. Finally, from millions of university syllabi, we find that
> graduates taking more AI-exposed curricula had higher first-job pay and shorter job searches after
> ChatGPT. Together, **these results point to forces pre-dating generative AI** and to the ongoing
> value of LLM-relevant education.

The first key result, which states that "_LLM advancements correlated with increased unemployment
risk \[..]_", seems to be wholly unsupported by this paper. Unless I'm entirely misreading, I hardly
think that statements like the following are consistent with this supposed key result.

> Overall, the timing is inconsistent with a deterioration that begins only after ChatGPT and
> suggests that pre-existing macroeconomic and sectoral forces contributed materially to the
> early-2022 rise in unemployment risk.

The other "Key Results" -- remote work mitigating negative market impacts and the effect of a
states' AI adoption -- I can't find any mention of in the paper. In fact, "remote work" doesn't seem
to even appear in the paper. Of course, I could have missed it. Maybe I didn't read the paper as
thoroughly as I thought. The only paragraph in the paper that I think might relate to those two "Key
Results" is this one:

> While these patterns hold nationally, a small number of states show post-launch increases in
> computer and math occupation unemployment risk (e.g., CA, WA, and AK; Figs. S15–S12). In  these
> cases, timing alone cannot rule out a contribution from LLM diffusion. However, across  states,
> post-launch unemployment risk remains comparable to pre-pandemic levels, suggesting  limited
> movement in the longer-run equilibrium.

Whilst this does seem consistent, I would hardly consider this one paragraph to be worthy of
contributing two of the "key results" of the paper.

The significant departure from this paper's findings may seem surprising. I've found this kind of
misrepresentation not all that uncommon. Services that are pushing "AI summaries" as an alternative,
or even as a replacement, for the authors' own abstracts, are now proving to be quite a problem. I
can no longer trust summaries of publications unless I know that they are not generated by a
language model.

Recently the [ACM] got into a spot of bother for their attempt to shove AI summaries at us. The
reasons I've seen for the preference for AI-generated summaries do not seem to make any sense. Are
non-technical people really paying for premium subscriptions to the ACM? Luckily it seems that
sanity prevailed, and the ACM elected to [move] the AI-generated summaries so that author abstracts
were the default. If you want to know more, Professor [Anil Madhavapeddy] has some great details in
his blog post on the topic.

[ACM]: https://dl.acm.org/
[Anil Madhavapeddy]: https://anil.recoil.org/notes/acm-ai-recs
[move]: https://social.sigsoft.org/@JonathanAldrich/115737714944382593

## Missing Significant Lessons {#missing-significant-lessons}

Putting aside the problem of hallucination for now, I think there are more human issues with relying
on LLM summaries: the loss of the journey and structure from the original publication. Preserving
only the conclusions, while stripping away the path to those conclusions, risks the real value of a
publication. Ironing out the structure and subtext -- the emphasis, asymmetry, and tone -- destroys
potentially valuable information.

This is a problem with any kind of summarisation, but I think is compounded under LLMs. The cost of
producing a summary of any required length is now vanishingly small. Such a summary might appear
sufficiently plausible, with the pretence of capturing all that is salient. Does the temptation to
then rely solely on these summaries become too great? Is the efficiency gain sufficient to justify
the loss of the journey and structure? How can we tell, if we don't know what we're losing in each
instance?

As an example, I was recently reading a paper called [Behind the Headline Number: Why Not to Rely on
Frey and Osborne's Predictions of Potential Job Loss from Automation]. The paper is about issues
with Frey and Osborne's predictions of potential job loss from automation in [The future of
employment: How susceptible are jobs to computerisation]. On page 16, about half way through the
paper, the authors are discussing an interpretation of the predictions of Frey and Osborne's model.
Here's an excerpt:

> Frey-Osborne (2017, p.266) suggest that: '_...the probability axis in Figure 3 which shows the
> distribution of the probabilities of individual occupations being automated can be seen as a
> rough timeline, where high probability occupations are likely to be substituted by computer
> capital relatively soon_'. Following this logic, Frey-Osborne (2017, p.266-67) then state that the
> U-shaped distribution of probabilities implies '_... two waves of computerisation separated by a
> 'technological plateau'_'
> \[..]
> In fact, the U-shaped distribution of probabilities of automation generated by Frey-Osborne **is
> much more likely to be a simple artefact of them having used a Logit model to derive those
> predictions together with the hand-labelling having assigned an even split of occupations between
> being and not being capable of full automation**.

That there might be such a mundane interpretation of the distribution was an important insight for
me. I was moved by the possibility and its implications. In this way, the conclusion of the paper
was actually less useful to me than the lesson to be suspicious of distributional stories that might
just be model artefacts.

This insight would not have survived any kind of summarisation -- human or LLM. This is why,
certainly for technical work, I've become increasingly uncomfortable with automatic summaries being
presented as a substitute for reading the original publication. Certainly it may save time, but I'm
no longer convinced that the trade-off is one that I want to accept.


[The Timmy Trap]: https://jenson.org/timmy/
[Behind the Headline Number: Why Not to Rely on Frey and Osborne's Predictions of Potential Job Loss from Automation]: https://papers.ssrn.com/abstract=3472764
[The future of employment: How susceptible are jobs to computerisation]: https://doi.org/10.1016/j.techfore.2016.08.019
[AI-exposed jobs deteriorated before ChatGPT]: https://arxiv.org/abs/2601.02554
