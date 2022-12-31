# blakerain.com

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Next JS](https://img.shields.io/badge/Next-black?style=for-the-badge&logo=next.js&logoColor=white)
![SASS](https://img.shields.io/badge/SASS-hotpink.svg?style=for-the-badge&logo=SASS&logoColor=white)
![AWS](https://img.shields.io/badge/AWS-%23FF9900.svg?style=for-the-badge&logo=amazon-aws&logoColor=white)
![AmazonDynamoDB](https://img.shields.io/badge/DynamoDB-4053D6?style=for-the-badge&logo=Amazon%20DynamoDB&logoColor=white)
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
|--------|-----------------------|--------------------------------------------|
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
from the query string, and should it find any, record them as a page view into the DynamoDB table. The record for a page
view contains the following items:

| Field            | Type     | Description                                              |
|------------------|----------|----------------------------------------------------------|
| `Path`           | `String` | The path to the page being visited                       |
| `Section`        | `String` | The string `view-` followed by the UUID of the page view |
| `Time`           | `String` | The `OffsetDateTime` for the page view                   |
| `UserAgent`      | `String` | The user agent string for the visitor's web browser      |
| `ViewportWidth`  | `Number` | The width of the viewport (i.e.: size of the window)     |
| `ViewportHeight` | `Number` | The height of the viewport                               |
| `ScreenWidth`    | `Number` | The width of the screen                                  |
| `ScreenHeight`   | `Number` | The height of the screen                                 |
| `Timezone`       | `String` | The visitor's timezone                                   |
| `Referrer`       | `String` | The referrer for the page view (e.g. `google.com`)       |
| `Duration`       | `Number` | The number of seconds the visitor has been on this page  |
| `Scroll`         | `Number` | The maximum distance that was scrolled (as a percentage) |

Of the above fields, the only fields that are required are the `Path`, `Section` and `Time` fields. All other fields are
entirely optional, and are only included in the record if they are present in the query-string given in the `GET`
request and can be parsed.

Once the `<Analytics>` component has mounted, it adds event listeners for the `scroll`, `visibilitychange` and
`pagehide` events. When the visitor scrolls the page, the `Analytics` component keeps track of the maximum scroll
distance. When the visibility of the page is changed, and the page is no longer visible, we also record the time at
which the page was hidden. Once the page is visible again, we record the total amount of time that the page was hidden.
This allows us to calculate the total amount of time that the page was visible.

When the page is hidden, or the `<Analytics>` component is unmounted, we send an update to the analytics record using a
`POST` request to the `/append` URL. This allows us to update the duration of a visit to the page and the maximum scroll
distance. The `POST` request send to the `/append` URL contains a JSON object with the following fields:

| Field      | Type     | Description                                         |
|------------|----------|-----------------------------------------------------|
| `path`     | `String` | The path to the page being visited                  |
| `uuid`     | `String` | The UUID of the page view                           |
| `duration` | `Number` | The updated duration spent on the page (in seconds) |
| `scroll`   | `Number` | The maximum scroll distance (as a percentage)       |

In order to transmit updates to the page view, we use the `Navigator.sendBeacon` function (see the MDN documentation for
[sendBeacon]). Using the `sendBeacon` function allows us to send data, even when the browser is about to unload the
page.

### Accumulating Page Views

Once a new page view has been recorded in the DynamoDB table, I also want to update the accumulation of these page
views in a number of dimensions. The following table describes the dimensions that we want to record. This is given as
the subject (such as the page being visited, or the site as a whole) and the time-frame being accumulated (daily, weekly,
etc). The table also provides an example of the primary key and hash key used in the DynamoDB table for this recording.

| Object      | Time-frame | Primary Key                | Hash key            | Description                                            |
|-------------|------------|----------------------------|---------------------|--------------------------------------------------------|
| Total Views | Day        | `page-view-day-2022-12-02` | `/page`             | Number of views for a specific day (2nd December 2022) |
|             | Week       | `page-view-week-2022-48`   | `/page`             | Number of views for a specific week (week 48, 2022)    |
|             | Month      | `page-view-month-2022-12`  | `/page`             | Number of views for a specific month (December 2022)   |
| Page        | Day        | `/post/some-blog-post`     | `Day-2022-12-02-18` | Number of views of page at hour of day (here at 18:00) |
|             | Week       | `/post/some-blog-post`     | `Week-2022-48-05`   | Number of views of page on day of week                 |
|             | Month      | `/post/some-blog-post`     | `Month-2022-12-02`  | Number of views of page on day of month                |
| Entire Site | Day        | `/site`                    | `Day-2022-12-02-18` | Number of views of page at hour of day (here at 18:00) |
|             | Week       | `/site`                    | `Week-2022-48-05`   | Number of views of page on day of week                 |
|             | Month      | `/site`                    | `Month-2022-12-02`  | Number of views of page on day of month                |

Accumulating this data for each page view requires performing nine updates to the DynamoDB table. Performing these
updates whenever a request is made to the `pv.gif` image by the client is less than ideal. For this reason, a [trigger]
Lambda function is included which receives events from the DynamoDB table. If the event received by the trigger function
is the insertion of a new page view record, the function performs the above record updates.

[blakerain.com]: https://blakerain.com
[next.js]: https://nextjs.org
[s3]: https://aws.amazon.com/s3/
[cloudfront]: https://aws.amazon.com/cloudfront/
[lambda]: https://aws.amazon.com/lambda/
[dynamodb]: https://aws.amazon.com/dynamodb/
[api gateway]: https://aws.amazon.com/api-gateway/
[api]: https://github.com/BlakeRain/blakerain.com/blob/main/lambda/src/bin/api.rs
[trigger]: https://github.com/BlakeRain/blakerain.com/blob/main/lambda/src/bin/trigger.rs
[input format]: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
[output format]: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-output-format
[sendbeacon]: https://developer.mozilla.org/en-US/docs/Web/API/Navigator/sendBeacon
