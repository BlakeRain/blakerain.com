---
title: Adding Search alongside SSG, WebAssembly and Yew
tags:
  - rust
  - yew
  - wasm
published: 2023-09-12T19:44:12.000Z
cover: /content/search-in-wasm-ssg-yew/cover.jpg
excerpt: |
  In this post I explain how I added search back into this site after changing over to using
  SSG with WebAssembly and the Yew framework in Rust.
---

In a [previous] post I explained how I had changed this site from one written in TypeScript to one
written in Rust. I explained how I achieved the minimum static site generation functionality of
[Next.js] with the [Yew] framework. However, a feature that I found rather fun for a site with so
little content was missing: search.

[previous]: /blog/ssg-and-hydration-with-yew
[Next.js]: https://nextjs.org/
[Yew]: https://yew.rs/

I had [previously] implemented search on this site in a manner that did not require any server-side
components. In this post I wanted to go over how I re-implemented the search feature in the new
site.

[previously]: /blog/updated-site-search

> Cover image courtesy of [Alex Gethin](https://unsplash.com/@alexis_g?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText) on [Unsplash](https://unsplash.com/photos/DKTShh1P7fw?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText).
