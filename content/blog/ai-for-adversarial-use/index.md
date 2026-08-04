---
title: Distillation, Experimentation, and Integration of AI for Adversarial Use
link: https://cloud.google.com/blog/topics/threat-intelligence/distillation-experimentation-integration-ai-adversarial-use
archive: https://archive.is/F3aou
date: 2026-02-13T19:22:00
tags:
  - llm
  - google
---

Seems that Google are getting upset that some group (or groups) are trying to [distill] their
chatbot [Gemini]. It's interesting that they've decided that the process of distillation in this
case is a form of attack:

> Google DeepMind and GTIG have identified an increase in model extraction attempts or "distillation
> attacks," a method of intellectual property theft that violates Google's terms of service.

It is a bit difficult to sympathise with Google here, as LLMs may well constitute a form of
[intellectual property theft]. Certainly this seems to be as much a form of advertising as it is a
report on advances in malicious uses of AI models.

> A common target for attackers is <mark>Gemini's exceptional reasoning capability</mark>. While
> internal reasoning traces are typically summarized before being delivered to users, attackers have
> attempted to coerce the model into outputting full reasoning processes.

> We are sharing a broad view of this activity to help raise awareness of the issue for
> organizations that build or operate their own custom models.

There are some good pieces of information in the report, such as how a malware downloader framework
is using Gemini to generate code to download and execute malware.

> HONESTCUE shares capabilities similar to PROMPTFLUX's "just-in-time" (JIT) technique that we
> previously observed; however, rather than leveraging an LLM to update itself, HONESTCUE calls the
> Gemini API to generate code that operates the "stage two" functionality, which downloads and
> executes another piece of malware.

[distill]: https://en.wikipedia.org/wiki/Knowledge_distillation
[Gemini]: https://en.wikipedia.org/wiki/Google_Gemini
[intellectual property theft]: https://en.wikipedia.org/wiki/Artificial_intelligence_and_copyright
