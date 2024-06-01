---
title: Moving my Lambda Functions to Rust
tags:
  - aws
  - rust
date: 2022-02-07T20:04:44.000Z
summary: |
  My experience changing the AWS Lambda functions for this website from Python to Rust.
---

Since I've started using Rust quite a bit more at work and in some personal projects, I've been
wondering how well Rust would fair when used in AWS Lambda functions. Back in 2018, AWS published a
[blog post](https://aws.amazon.com/blogs/opensource/rust-runtime-for-aws-lambda/) announcing a
runtime for Rust on AWS Lambda. More recently, I found the comments on this [reddit
post](https://www.reddit.com/r/rust/comments/lz7vnq/anyone_running_rust_in_aws_lambda/) to be quite
interesting. Aleksandr Filichkin also published in September last year an [AWS Lambda
Battle](https://filia-aleks.medium.com/aws-lambda-battle-2021-performance-comparison-for-all-languages-c1b441005fd1)
that showed the performance of Rust on AWS Lambda was quite impressive. In a later post in
November, Aleksandr wrote about the performance of [x86 vs
ARM](https://filia-aleks.medium.com/aws-lambda-battle-x86-vs-arm-graviton2-perfromance-3581aaef75d9)
on AWS Lambda, which again showed Rust to be quite performant, and even more so on ARM.

{{< bookmark
url="https://github.com/awslabs/aws-lambda-rust-runtime"
title="GitHub - awslabs/aws-lambda-rust-runtime: A Rust runtime for AWS Lambda"
description="A Rust runtime for AWS Lambda. Contribute to awslabs/aws-lambda-rust-runtime development by creating an account on GitHub."
author="awslabs"
publisher="GitHub"
thumbnail="https://opengraph.githubassets.com/e6c849253e37fbc1db7ae49d6368cc42988843123134001207eff64f7c470c9f/awslabs/aws-lambda-rust-runtime"
icon="https://github.com/fluidicon.png"
>}}

# Site Analytics

A few months ago I decided to change the analytics for this website over to a custom analytics
implementation, replacing my use of [Simple Analytics](https://simpleanalytics.com). The analytics
are now provided by a couple of lambda functions: one which provides the API for collecting
statistics and reporting, and another that processes DynamoDB events to provide simple aggregation.

I've been fairly pleased with this approach: it means I don't really pay anything for the
analytics, as AWS Lambda and DynamoDB are extremely cheap for small use cases like this. Moreover,
the reporting provided the minimal amount of information that I currently desire from site
analytics.

As a first attempt using Rust on AWS Lambda I felt that these two functions were a good starting
point for a few reasons:

1. The API function is behind an API Gateway proxy, and so I could make use of the [lambda-http]
   crate to handle HTTP requests and responses.
2. The trigger function processes events from a DynamoDB stream, which is another fairly nice
   use-case for a Lambda function.
3. There's little pressure for these to be performant or stable, as it only effects this site 😆

# Building Rust for AWS Lambda

I initially had a number of issues compiling Rust code for AWS Lambda using the method described in the
[README](https://github.com/awslabs/aws-lambda-rust-runtime#deployment) in the AWS Lambda Rust
runtime repository. The main issue I came across was a segfault from LLVM when compiling the `regex-syntax`
crate. This seemed to only arise when I compiled in Docker on the M1 when targeting x86-64. As AWS
support for ARM in Lambda is quite recent, none of the AWS Lambda Rust build images I looked at
currently seemed to support it.

{{< bookmark
url="https://github.com/softprops/lambda-rust"
title="GitHub - softprops/lambda-rust: 🐳 🦀 a dockerized lambda build env for rust applications"
description="This docker image extends lambda ci provided.al2 builder docker image, a faithful reproduction of the actual AWS 'provided.al2' Lambda runtime environment, and installs rustup and the stable rust toolchain."
author="awslabs"
publisher="GitHub"
thumbnail="https://opengraph.githubassets.com/31c9066c430630fe306c04d47e6ef314b5395bc6ce40867c9d890c2e5e13e21a/softprops/lambda-rust"
icon="https://github.com/fluidicon.png"
>}}

I'm sure that at some point they will support ARM, but for the time being it was necessary for me
to create a [Dockerfile] that used the `al2-arm64` image provided by AWS in the [ECR]. This
Dockerfile simply installs a Rust version (currently 1.58.1) and copies over a [build script]. When
executed, the build script invokes `cargo` to compile a release build of the lambda functions, and
then bundles the compiled executables into a ZIP file, with each executable named `bootstrap` as
required by AWS Lambda.

One caveat that I came across was the use of `libssl` indirectly from the [fernet] crate I use to
encrypt the session tokens for the analytics reporting API. The `libssl` library appears not to be
present on AWS Lambda, and therefore I needed to include it in the zip package. I considered deploying
a Lambda layer for this purpose, however I thought it overkill for just one function. However, the
same folder structure can be used to provide [library dependencies] in a zip package. The somewhat
evil trick I use is to invoke `ldd` to find the resolved library for `libssl` on the Docker
container and copy that file into a `lib` directory in the zip package.

```bash caption="Hacky fix for missing libssl on Lambda"
cp $(ldd "$EXE_PATH" | grep ssl | awk '{print $3}') "$OUTPUT_DIR/lib/"
```

Now that my executables could be run by Lambda, I could start iterating the API and trigger
functions.

# Implementing the API

The initial implementation of the API in Rust has gone very easily, mostly due to the structures
provided in various crates available to Rust, including the [lambda-http] crate. I was able to
finish most of the API code on one Sunday morning.

Making the calls to DynamoDB in Rust was a very nice experience. The AWS client crate makes use of
"builder" syntax, which works quite nicely. For example, to build a query for a particular path and
section (the primary and sort keys for the analytics table) is quite easily comprehended, if
somewhat verbose:

```rust
let res = env
    .ddb
    .query()
    .table_name(env.table_name.to_owned())
    .key_condition_expression("#P = :v1 AND begins_with(#S, :v2)")
    .expression_attribute_names("#P", "Path")
    .expression_attribute_names("#S", "Section")
    .expression_attribute_values(":v1", AttributeValue::S(path))
    .expression_attribute_values(":v2", AttributeValue::S(section))
    .send()
    .await?;
```

Implementing the API was not entirely a matter of simply translating the Python code. Mostly this
was due to the fact that Rust tends to encourage us to better handle errors than Python. I found
that there were a number of times in the Python code where I was simply assuming that a value was
as I expected. As an example, when we query DynamoDB we get back a `dict` of attributes in Python,
where each attribute is another `dict` containing the DynamoDB [named-value] pair. This tends to
lead me to write Python code like:

```python
int(item["ViewCount"]["N"])
```

Unfortunately I'm making a lot of assumptions in the above code, such as:

1. The `item` is a `dict`,
2. There is a `ViewCount` attribute,
3. The `ViewCount` attribute is a `dict`,
4. There is an `N` attribute in the `ViewCount` dictionary, and
5. The value can be parsed as an integer with `int()`.

Rust forced me to be more aware of this: Each item from DynamoDB is a `HashMap` mapping a `String`
key to an [AttributeValue]. The equivalent Rust code `item["ViewCount"]` makes use of the `Index`
trait for `HashMap` which will panic if the given key is not found in the mapping ([see
here](https://doc.rust-lang.org/std/collections/struct.HashMap.html#method.index)). This encouraged
me to use the [`get`](https://doc.rust-lang.org/std/collections/struct.HashMap.html#method.get)
method to access the attributes of an item returned from DynamoDB. The `AttributeValue` enumeration
provides a number of methods that help with unwrapping the enumeration, which all return a
`Result`, which we need to match against (or just lazily `unwrap`).

```rust caption="Sensibly decoding a response from DynamoDB"
if let Some(view_count_attr) = item.get("ViewCount") {
    match view_count_attr.as_n() {
        Ok(view_count) => {
            match i32::from_str_radix(view_count, 10) {
                Ok(n) => n,
                Err(_) => {
                    // We couldn't parse the string as an i32
                }
            }
        }
        Err(_) => {
            // The 'ViewCount' was not an 'N'
        }
    }
} else {
    // There is no 'ViewCount' attribute
}
```

This results in somewhat cleaner code. That being said, there are times where I felt justified in
using `unwrap` and `expect` and allowing the Lambda function to panic.

```rust caption="Lazily unwrapping values"
i32::from_str_radix(item["ViewCount"].as_n().unwrap(), 10).unwrap() // 😤
```

# Implementing the Trigger

Once I had come to understand the structures and functions in the Rust AWS client crates, I had a
far easier time building the trigger function. This function simply responds to events received
from a DynamoDB stream, which it receives as a `serde_json::Value`. Depending on the contents of
the event, it performs various aggregations by updating items to increment the `ViewCount`
attribute for weekly and monthly totals.

I was somewhat worried about the parsing of user agent strings: in Python I did this using the
[user-agents](https://pypi.org/project/user-agents/) library. However I found a rather nice crate
[woothee](https://crates.io/crates/woothee) that performs the same operation just as well for my
use case.

# Conclusion

I was pleasantly surprised at how well the process went. Apart from the somewhat slow start getting
Rust code compiled for AWS Lambda on ARM, once I had my bearings it was quite easy going.

I am somewhat worried that the error handling is not as graceful as it should be. I'm somewhat
nervous of cases where I'm using the `Index` trait of a `HashMap`, or just `unwrap`-ing or
`expect`-ing a value where I should be using `match` and `if let`. I think I'd better go over the
Lambda functions again some other time to round off the edges.

As before, all code is available on [GitHub](https://github.com/BlakeRain/blakerain.com), with the
Rust Lambda functions found in the
[lambda](https://github.com/BlakeRain/blakerain.com/tree/main/lambda) directory.

[lambda-http]: https://docs.rs/lambda_http/latest/lambda_http/
[dockerfile]: https://github.com/BlakeRain/blakerain.com/blob/215a856698da63947ef821d0ebb6276080607952/lambda/Dockerfile
[ecr]: https://gallery.ecr.aws/lambda/provided
[build script]: https://github.com/BlakeRain/blakerain.com/blob/215a856698da63947ef821d0ebb6276080607952/lambda/build.sh
[fernet]: https://docs.rs/fernet/0.1.4/fernet/
[library dependencies]: https://docs.aws.amazon.com/lambda/latest/dg/configuration-layers.html#configuration-layers-path
[named-value]: https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_AttributeValue.html
[attributevalue]: https://docs.rs/aws-sdk-dynamodb/0.6.0/aws_sdk_dynamodb/model/enum.AttributeValue.html

> Cover image courtesy of Jay Heike ([@jayrheike](https://unsplash.com/@jayrheike) on unsplash).
