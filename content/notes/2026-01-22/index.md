---
title: GPTZero finds 100 new hallucinations in NeurIPS 2025 accepted papers
link: https://gptzero.me/news/neurips/
date: 2026-01-22T07:15:56
---

GPTZero have scanned 4,841 papers accepted to NeurIPS 2025 and found hallucinated citations that
were not caught by the reviewers. They include a table of 100 confirmed hallucinations, from 51
papers, that were not previously reported.

The paper [Learning the Wrong Lessons: Syntactic-Domain Spurious Correlations in Language Models]
has two references that GPTZero claim do not exist: one to a publication titled "_Applications of
llms in legal document analysis_", and another titled "_Leveraging large language models for
financial forecasting_". Both references (numbers 11 and 36) are used in the first sentence of the
introduction to the paper:

> LLMs are increasingly being deployed in a variety of important domains \[42, **36, 11** 😔, 5]. To
> be reliable in such areas they should understand the semantics of instructions and the domains of
> the tasks \[14], yet recent work shows that the correctness of their responses can change when
> encountering subtle linguistic variations in instructions \[38, 4].

[Learning the Wrong Lessons: Syntactic-Domain Spurious Correlations in Language Models]: https://openreview.net/forum?id=oBikm5Rshc
