---
title: Towards a Science of AI Agent Reliability
link: https://www.normaltech.ai/p/new-paper-towards-a-science-of-ai
date: 2026-02-24T21:39:00
tags:
  - ai
  - agents
---

[Arvind Narayanan] and [Sayash Kapoor], the authors of the book [AI Snake Oil], along with [Stephan
Rabanser] have written a new paper called [Towards a Science of AI Agent Reliability] in which they
define an evaluation for agent reliability.

Drawing inspiration from safety-critical engineering, they decompose reliability into four
dimensions:

1. **Consistency** -- If the agent gets it right once, it will always get it right. Many models have
   trouble giving a consistent answer, with 30% to 75% across the board.
2. **Robustness** -- When conditions are not perfect, the model should not loose reliability. For
   example, rephrasing the instructions with the same semantic meaning causes performance to drop
   substantially.
3. **Predictability** -- Communicating when the agent is unsure, rather than just confidently
   guessing. This is the weakest dimension across all models and tests. When agents report
   confidence, it actually carries little relevance to the actual correctness of the response, even
   to the point that most models could not distinguish their correct predictions from incorrect
   ones.
4. **Safety** -- Mistakes made by the agent are more likely to be minor and correctable, rather than
   catastrophic. Whilst adherence to guardrails has improved considerably, common failure modes
   remain.

They use two benchmarks, a simulation of a customer service agent and a general assistant, to
evaluation the reliability of a range of LLMs from OpenAI, Anthropic, and Google. They show that,
whilst accuracy has improved quite rapidly, reliability has only improved slightly over time.

{% from "macros/figure.html" import figure %}
{{ figure("reliability-over-time.png", height="400", caption="Excerpt from Figure 1: Reliability gains lag behind capability progress") }}

One of my initial takeaways is that the scope of what they mean by "safety" is quite limited to only
operational safety, and does not include many of the [harms] and [biases] that I am often quite
concerned with. This is something that the authors also address in their blog post introducing the
paper.

> We use safety narrowly to mean bounded harm when failures occur, not broader concerns like
> alignment. We are still iterating on how we measure safety, so we report it separately from the
> aggregate reliability score.

Narayanan and Kapoor also write on their Substack [AI as Normal Technology], previously
`aisnakeoil.com` before they [renamed it] to the name of a [paper] of theirs that is also called _AI
As Normal Technology_. I'm not entirely sure that AI is either snake oil or a normal technology, but
I do appreciate the appeal to reasonable discussion.

[Arvind Narayanan]: https://scholar.google.com/citations?hl=en&user=0Bi5CMgAAAAJ
[Sayash Kapoor]: https://scholar.google.com/citations?user=MsKX_6kAAAAJ&hl=en
[Stephan Rabanser]: https://scholar.google.com/citations?hl=en&user=T5hu6dsAAAAJ
[Towards a Science of AI Agent Reliability]: https://arxiv.org/abs/2602.16666
[AI Snake Oil]: https://en.wikipedia.org/wiki/AI_Snake_Oil
[AI as Normal Technology]: https://www.normaltech.ai/
[renamed it]: https://x.com/sayashk/status/1965497361968345582
[paper]: https://knightcolumbia.org/content/ai-as-normal-technology
[harms]: https://arxiv.org/abs/2512.05929
[biases]: https://arxiv.org/abs/2309.00770
