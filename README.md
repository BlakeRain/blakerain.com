# Source for my Website

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Next JS](https://img.shields.io/badge/Next-black?style=for-the-badge&logo=next.js&logoColor=white)
![SASS](https://img.shields.io/badge/SASS-hotpink.svg?style=for-the-badge&logo=SASS&logoColor=white)
![AWS](https://img.shields.io/badge/AWS-%23FF9900.svg?style=for-the-badge&logo=amazon-aws&logoColor=white)
![AmazonDynamoDB](https://img.shields.io/badge/Amazon%20DynamoDB-4053D6?style=for-the-badge&logo=Amazon%20DynamoDB&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![Rust](https://img.shields.io/badge/rust-%23000000.svg?style=for-the-badge&logo=rust&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/github%20actions-%232671E5.svg?style=for-the-badge&logo=githubactions&logoColor=white)

This repository contains the sources for my website: [blakerain.com]. The website is built using [Next.js]. It also
includes some analytics code that is written in Rust and runs in AWS. The website is stored in an [S3] bucket and served
using the AWS [CloudFront] CDN. Deployment from this repository is performed by a GitHub workflow.

## Analytics

The analytics for the site is quite simple, consisting of a couple of AWS [lambda] functions and a [DynamoDB] table. The
two lambda functions provide both the API and a back-end trigger function to perform accumulation.

![Layout](https://github.com/BlakeRain/blakerain.com/blob/main/public/content/site-analytics/analytics-layout.drawio.png?raw=true)

The domain `pv.blakerain.com` is aliased to an AWS [API Gateway] domain. The domain is mapped to an API which allows
`GET` and `POST` requests and forwards these requests to the [api] Lambda function. The Lambda function receives these
HTTP `GET` or `POST` requests encoded as JSON (see the [input format] for a Lambda function for a proxy integration).
The Lambda function processes the request and then returns an HTTP response (see the [output format]).

The lambda function response to the following resources:

| Method | URL                   | Description                                |
|---     |-----------------------|--------------------------------------------|
| `GET`  | `/pv.gif`             | Records a page view                        |
| `POST` | `/append`             | Update a page view record                  |
| `POST` | `/api/auth/signin`    | Authenticate access to the analytics       |
| `POST` | `/api/views/week`     | Get page view stats for a specific week    |
| `POST` | `/api/views/month`    | Get page view stats for a specific month   |
| `POST` | `/api/browsers/week`  | Get browser stats for a specific week      |
| `POST` | `/api/browsers/month` | Get browser stats for a specific month     |
| `POST` | `/api/pages/week`     | Get the total page count for a given week  |
| `POST` | `/api/pages/month`    | Get the total page count for a given month |

### Recording Page Views

When a visitor loads the site, if they visit a page that includes the `<Analytics>` component, a request is made to the
`pv.blakerain.com` domain. Specifically, it tries to load an image from `https://pv.blakerain.com/pv.gif`. The URL
includes a query-string that encodes the various information about the site visit.

When the `GET` request for `pv.gif` image is received by the lambda function, it attempts to extract meaningful values
from the query string, and should it find any, record them as a page view into the DynamoDB table.

[blakerain.com]: https://blakerain.com
[next.js]: https://nextjs.org
[s3]: https://aws.amazon.com/s3/
[cloudfront]: https://aws.amazon.com/cloudfront/
[lambda]: https://aws.amazon.com/lambda/
[dynamodb]: https://aws.amazon.com/dynamodb/
[api gateway]: https://aws.amazon.com/api-gateway/
[api]: https://github.com/BlakeRain/blakerain.com/blob/main/lambda/src/bin/api.rs
[input format]: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
[output format]: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-output-format
