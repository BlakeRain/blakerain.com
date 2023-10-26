# blakerain.com

![AWS](https://img.shields.io/badge/AWS-%23FF9900.svg?style=for-the-badge&logo=amazon-aws&logoColor=white)
![Rust](https://img.shields.io/badge/rust-%23000000.svg?style=for-the-badge&logo=rust&logoColor=white)

This repository contains the sources for my website: [blakerain.com]. The website is built using
[Yew]. The website is deployed to an [S3] bucket and served using the AWS [CloudFront] CDN.
Deployment from this repository is performed by a [Gitea] workflow.

## Cargo Features

There are a number of Cargo feature flags that are used during development and during release
builds. These features are as follows:

- `static` feature is set when we want to build the static rendering application, called
  `site-build`, which will generate the static HTML pages for the site.
- `hydration` feature is set when we're building the WebAssembly for hydration into a statically
  rendered page.

During development, neither `static` nor `hydration` are set. This allows commands like `trunk
serve` to serve the WebAssembly and nicely rebuild upon file changes and so on.

During a release build, we first build the site using `trunk build` with the `hydration` feature
enabled. This will build a WebAssembly module with the hydration support. Afterwards, we use
`cargo run` to run the `site-build` app with the `static` feature set, which allows us to generate
all the static pages.

```
trunk build --release --features hydration
cargo run --release --features static --bin site-build
```

[blakerain.com]: https://blakerain.com/
[Yew]: https://yew.rs/
[S3]: https://aws.amazon.com/s3/
[CloudFront]: https://aws.amazon.com/cloudfront/
[Gitea]: https://docs.gitea.com/usage/actions/overview
