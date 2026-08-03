---
title: Moving a Toy Application To Bunny's Magic Containers
date: 2026-06-02T12:20:00
tags:
  - bunny
  - docker
  - rust
coverImage:
  author: Şeyma Dalar
  url: https://www.pexels.com/photo/close-up-photo-of-rabbits-playing-11702024/
---

Since [moving my website] over to Bunny's CDN I've been starting to get to grips with Bunny's other
offerings. Having made use of [Bunny Storage] and [Bunny CDN], I have three more Bunny products that
I want to still want to explore: [Magic Containers], [Edge Scripting], and [Bunny Database]. So, I
decided to move my [cement] application over to Bunny.

<!--more-->

A quick recap of what these two products are:

- [Magic Containers] allows you to deploy Docker containers to Bunny's network. Containers are
  arranged together into an application, where the constituent containers are within the same
  network. A CDN pull zone can be created to deliver an application to users over the Internet.
- [Bunny Database] is a DBaaS offering that allows you to deploy an SQLite-compatible database to
  Bunny's network, and Bunny take care of making sure writes are replicated. This is built on top of
  [Turso]'s [libSQL] library.

Cement was already published as a [Docker image], so deploying it as a Magic Container should not
be too difficult. The main change that I need to make is to change the database to use [libSQL]
instead of SQLite.

# SQLite to Turso

Changing the database from SQLite to [Turso] was, unfortunately, quite a lot more work that I would
have preferred. Cement is written using [SQLx], which takes care of a lot of SQL-specific
functionality, especially handing the marshalling of Rust types to and from different SQL databases.

The marshalling from database types to Rust is typically done via the [sqlx::FromRow] and the
[sqlx::Decode] traits. The `FromRow` trait has a derive macro, which makes it very easy to use with
a `struct` type, where the fields of the `struct` are marshalled from the columns returned from the
database. Cement basically has _one_ table, called `posts`, which is marshlled into the `Post`
[structure](https://git.blakerain.com/BlakeRain/cement/src/commit/8c273e70551ec2771fad9db953ca8265eb810698/src/model.rs#L12-L21):

```rust
#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct Post {
    pub id: i32,
    pub slug: String,
    pub content: String,
    #[serde(with = "time::serde::rfc2822")]
    pub added: OffsetDateTime,
    pub remote: String,
    pub highlight: Option<String>,
}
```


[moving my website]: /blog/moving-site-to-bunny-net/
[Bunny Storage]: https://bunny.net/storage/
[Bunny CDN]: https://bunny.net/cdn/
[Magic Containers]: https://bunny.net/magic-containers/
[Edge Scripting]: https://bunny.net/edge-scripting/
[Bunny Database]: https://bunny.net/database/
[cement]: https://git.blakerain.com/BlakeRain/cement
[Bunny's DNS]: https://bunny.net/dns/
[libSQL]:https://github.com/tursodatabase/libsql
[Turso]: https://turso.tech/
[Docker image]: https://git.blakerain.com/BlakeRain/-/packages/container/cement
[SQLx]: https://docs.rs/sqlx/latest/sqlx/
[sqlx::FromRow]: https://docs.rs/sqlx/latest/sqlx/trait.FromRow.html
[sqlx::Decode]: https://docs.rs/sqlx/latest/sqlx/trait.Decode.html
