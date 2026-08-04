---
title: Bunny have released an SQLite-compatible database
link: https://bunny.net/blog/meet-bunny-database-the-sql-service-that-just-works/
date: 2026-02-03T20:35:10
tags:
  - bunny
  - databases
  - serverless
  - sqlite
---

I've been experimenting Bunny for a while now, and it's been mostly a great experience so far. I
really should take some time to write about what I've been doing with their [edge scripting] and
WebAssembly as an alternative to the AWS Lambda/S3/CloudFront.

With the addition of an SQLite-compatible database, I should be able to migrate databases from
[Turso] without too much hassle. Bunny's database support appears to also be based on [libSQL]
(built by Turso), so there should be little to refactor.

<!--more-->

The pricing for Bunny seems pretty clear:

| Component   | Cost                     |
| ----------- | ------------------------ |
| Reads       | $0.30 per billion rows   |
| Writes      | $0.30 per million rows   |
| Storage     | $0.10 per GB/month       |

> [!NOTE] Reads are biller per billion, and writes are billed per *million*
> So I guess that means writes are a thousand times more expensive than reads, which is the same
> as Turso.

Databases only incur storage costs when idle, with one primary region charged continuously and
read replicas only adding cost when serving traffic, metered per hour.

I think Turso will still work out cheaper, even if they do want to charge a $5.99 a month
subscription. Turso's developer subscription gets you 9GB of storage, 2.5B reads and 25M writes. On
Bunny that'd work out to:

| Component | Usage | Cost     | Total     |
| --------- | ----: | -------: | --------: |
| Reads     | 2.5B  | $0.30/B  | $1.25     |
| Writes    | 25M   | $0.30/M  | $7.50     |
| Storage   | 9GB   | $0.10/GB | $0.90     |
| **Total** |       |          | **$9.65** |

This does overlook the advantage that Bunny's database is running on their network, rather than AWS.

[edge scripting]: https://bunny.net/edge-scripting/
[Turso]: https://turso.tech/
[libsql]: https://crates.io/crates/libsql
