# blakerain.com

Repository for the customized [Casper](https://github.com/tryghost/Casper) theme for my blog
along with various related bits and pieces.

## Search Data Workflow

This repository contains the Python
[script](https://github.com/BlakeRain/blakerain.com/blob/master/search/update-search.py) which
updates the search data used by the site. This script is run by a GitHub workflow called
[Update Search Data](https://github.com/BlakeRain/blakerain.com/blob/master/.github/workflows/update-search-data.yml).
This workflow is triggered either manually or when I update or publish a post on the site. A set
of webhooks are installed in Ghost which call an AWS Lambda function called
[ghost-post-actions](https://github.com/BlakeRain/blakerain.com/blob/master/lambda/ghost-post-actions/index.js).
This translates the Ghost webhook to an invocation of the GitHub workflow via the GitHub API.
