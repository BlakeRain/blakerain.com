<div align="center">

<a href="https://blakerain.com/">
  <img src="https://blakerain.com/media/site-screenshot.png" width="400">
</a>

<h4><a href="https://blakerain.com/">blakerain.com</a> — my personal site</h4>

![Release](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fgit.blakerain.com%2Fapi%2Fv1%2Frepos%2FBlakeRain%2Fblakerain.com%2Ftags%3Fpage%3D1%26limit%3D1&query=%24.0.name&label=Release)
![Issues](https://img.shields.io/gitea/issues/open/BlakeRain/blakerain.com?gitea_url=https%3A%2F%2Fgit.blakerain.com%2F)
![Build](https://git.blakerain.com/BlakeRain/blakerain.com/badges/workflows/check.yaml/badge.svg)
![Website](https://img.shields.io/website?url=https%3A%2F%2Fblakerain.com%2F)

</div>

---

This is the repository for my website [blakerain.com](https://blakerain.com/), which features a blog and some informational pages.

The website is built using a custom processor written in Rust, and is deployed to the [Bunny] CDN by a Forgejo [workflow].

## Building

The site can be built using the `Makefile` in the root of the repository:

```
make
```

A release build can be built with `make release`.

You can run a local development server that will rebuild the site on any changes and cause the
browser to reload the page with the new content using `cargo run --bin dev`.

[Bunny]: https://bunny.net/
[workflow]: https://git.blakerain.com/BlakeRain/blakerain.com/src/branch/main/.forgejo/workflows/deploy.yaml
