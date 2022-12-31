# blakerain.com

This repository contains the sources for the website [blakerain.com]. The website is built using
[Next.js].

[blakerain.com]: https://blakerain.com
[next.js]: https://nextjs.org

## Analytics

The analytics for the site is quite simple, consisting of a couple of AWS [lambda] functions and a [DynamoDB] table. The
two lambda functions provide both the API and a back-end trigger function to perform accumulation.

![Layout](https://github.com/BlakeRain/blakerain.com/blob/main/public/content/site-analytics/analytics-layout.drawio.png?raw=true)



[lambda]: https://aws.amazon.com/lambda/
[dynamodb]: https://aws.amazon.com/dynamodb/
