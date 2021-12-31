---
slug: moving-towards-jamstack-with-netlify
title: Moving Towards JamStack with Netlify
tags:
  - ghost-tag
  - javascript
  - react
excerpt: In this post I outline the steps that I took to make this blog a static
  site, whilst still maintaining some of the advantages of the Ghost CMS.
published: 2021-08-01T17:41:22.000Z
cover: /content/Screenshot-2021-08-01-at-18.29.16.jpg
---

I've recently been tinkering with the serverless approach to application development and hosting. I decided to change this website to an entirely static site. However I didn't want to just use a GitHub repository of Markdown files, preferring to maintain some of the advantages of the Ghost CMS.

The previous state of the site comprised three main components:

1. A domain (`blakerain.com`) managed by AWS [Route53](https://aws.amazon.com/route53/),
1. An [EC2](https://aws.amazon.com/ec2/) instance running the Ghost CMS, and
1. A MySQL [RDS](https://aws.amazon.com/rds/) instance.

Any requests to the site are processed the by EC2 instance alone using the built-in Ghost front-end. The Ghost administration interface is therefore also exposed to the public. The data for the CMS is maintained by a MySQL database managed by AWS RDS.

My goal was to remove the EC2 and RDS instances and change the structure of the site as follows:

1. The Ghost CMS will run as a Docker instance on a server I have at home,
1. Images would be stored in Amazon S3 by a custom storage adapter, and
1. A static site is generated, and then hosted by [Netlify](https://www.netlify.com).

### Ghost and Docker

I wanted to move the Ghost CMS from the EC2 instance into a Docker container on a local server at my home. To build this Docker container I used the [official Docker image](http://localhost:2368/p/754d8315-38fa-49ad-8ac1-62ffc1f02c2e/) as the base. I needed to add a [custom storage adapter](https://ghost.org/docs/config/#creating-a-custom-storage-adapter) that would make use of the AWS SDK to store images in S3. Therefore I needed to ensure that the [AWS SDK](https://www.npmjs.com/package/aws-sdk) was available in the image.

In order to ensure that the content of the site survives the container, and to provide the S3 storage adapter code, I opted to use a [bind mount](https://docs.docker.com/storage/bind-mounts/) which was made available under `/var/lib/ghost/content` in the container. This way I could rebuild the Ghost image without fear of loosing the site contents and configuration. Moreover I am able to back up this directory from the server to my Synology.

Once I had the Ghost instance up and running, migrating the data from one instance of Ghost to another was fairly simple. Ghost provides a means of exporting the site data as JSON and importing this into a new instance. All this can be accomplished via the Ghost administration interface.

There was one issue I had that ended up taking some time to remediate: the changeover of the storage adapter. Because I'd changed over to using S3 as the storage back-end, the URLs for the images in each of the blog posts was now incorrect. The first fix I considered was using SQL to find-and-replace all the URLs in the posts. However, in the end I opted for just editing each post and replacing the image. This is quite easy to do with the Ghost authoring tools. Moreover, this also gave me the opportunity to fix some of the screenshots.

### Generating the Static Site

In order to render the site I decided to use React Static: a static site generator for React. I chose this approach over other [much easier options](https://ghost.org/docs/jamstack/) as I wanted to move away from Ghost themes – and I really enjoy using React :)

```bookmark
type: bookmark
url: https://github.com/react-static/react-static
metadata:
  url: https://github.com/react-static/react-static
  title: "GitHub - react-static/react-static: ⚛️ 🚀 A progressive static site
    generator for React."
  description: "⚛️ 🚀 A progressive static site generator for React. - GitHub -
    react-static/react-static: ⚛️ 🚀 A progressive static site generator for
    React."
  author: react-static
  publisher: GitHub
  thumbnail: https://repository-images.githubusercontent.com/102987907/733d9200-6288-11e9-9f58-538c156753f8
  icon: https://github.com/fluidicon.png
```

I used the Ghost [Content API](https://ghost.org/docs/content-api/) to extract the navigation, posts, and pages. I then render them using React. The site is a very simple React application, with only a few components.

### Deploying to Netlify

Deploying the site to Netlify is as easy as using the [Netlify CLI](https://docs.netlify.com/cli/get-started/) on the command line after building the static site using React Static. All I required was a Netlify personal access token and the API ID of the site. Both of which can be easilly found in the Netlify interface.

```bash
# Build the static site
yarn build

# Deploy the site to Netlify
npx netlify-cli deploy --auth=<AUTH_TOKEN> \
                --dir=dist --site=<SITE_API_ID> --prod
```

Because I like to make my life difficult, I wanted to be able to automate this process: when I made a change in the Ghost CMS a new build should be triggered and the artifacts deployed to Netlify.

As I rather enjoy using GitHub workflows, I decided to create one to perform the build and deployment of the site. This meant that I needed the GitHub workflow to be able to connect to the Content API of the Ghost instance. However, this Ghost instance is running on a machine that lives in my local network.

In order to achieve this I created a new Docker container on the same machine. This container runs the [GitHub Actions Runner](https://github.com/actions/runner). My goal was to attach this as a self-hosted runner to the GitHub repository, and this would allow the actions to connect to the local Ghost CMS.

As a security precaution, GitHub encourage you to not attach a self-hosted runner to a public repository. Therefore it was necessary for me to create a private repository which contains the workflow for building and deploying the site. As the repository is private, I have reproduced the workflow as a Gist:

```bookmark
type: bookmark
url: https://gist.github.com/BlakeRain/cae8edfa273d7603d25e5527c6821984
metadata:
  url: https://gist.github.com/BlakeRain/cae8edfa273d7603d25e5527c6821984
  title: Workflow to build and deploy the static blakerain.com
  description: Workflow to build and deploy the static blakerain.com - deploy.yml
  author: "262588213843476"
  publisher: Gist
  thumbnail: https://github.githubassets.com/images/modules/gists/gist-og-image.png
  icon: https://gist.github.com/fluidicon.png
```

The final piece of the puzzle was to connect Ghost to GitHub: when I make a change to the site I wanted the GitHub workflow to execute. As the GitHub API requires authentication, I created a small [lambda function](https://github.com/BlakeRain/blakerain.com/blob/main/lambda/ghost-post-actions/index.js). This function processes the POST request from the Ghost CMS [webhook](https://ghost.org/docs/webhooks/) and in turn makes a call to the GitHub API to trigger a [workflow dispatch event](https://docs.github.com/en/rest/reference/actions#create-a-workflow-dispatch-event).

### Final Thoughts

Now that I have a static version of the site, hosted for free at Netlify, I'm sure that I'll enjoy the cost saving (around $55 per month). Moreover the site loads significantly faster from the Netlify CDN than it did from the little EC2 instance. I feel much safer with the Ghost CMS administration interface running on a local server rather than it being exposed to the Internet.

As before, all the sources for the site are available on GitHub. This includes the cobbled together bits and pieces for the S3 storage adapter and the GitHub Actions Runner Docker image.

```bookmark
type: bookmark
url: https://github.com/BlakeRain/blakerain.com
metadata:
  url: https://github.com/BlakeRain/blakerain.com
  title: "GitHub - BlakeRain/blakerain.com: Repository for the static generator
    for my blog"
  description: Repository for the static generator for my blog. Contribute to
    BlakeRain/blakerain.com development by creating an account on GitHub.
  author: BlakeRain
  publisher: GitHub
  thumbnail: https://repository-images.githubusercontent.com/155570276/9e808f00-3b06-11eb-913d-44e30d832a70
  icon: https://github.com/fluidicon.png
```



