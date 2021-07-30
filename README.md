# blakerain.com

[![Deploy Static Site](https://github.com/BlakeRain/blakerain.com/actions/workflows/deploy-static-site.yml/badge.svg)](https://github.com/BlakeRain/blakerain.com/actions/workflows/deploy-static-site.yml)
[![Netlify Status](https://api.netlify.com/api/v1/badges/ba2a37a1-cb69-4db3-af29-c0a230373b70/deploy-status)](https://app.netlify.com/sites/blakerain-static/deploys)

This repository contains the sources for the website [blakerain.com]. The website is built using
[react-static] from content managed by the [Ghost CMS].

This design for the site is inspired by the [Jamstack] principles of delivering as much of the
site as static content as possible.

The site content is authored using a Ghost instance running in a Docker container. In addition a
GitHub actions runner running in the same network as the Ghost instance is attached to this
repository. The [build workflow] expects to be able to connect to the Ghost instance, and will
build the static site and then upload it to S3.

[blakerain.com]: https://blakerain.com
[react-static]: https://github.com/react-static/react-static
[jamstack]: https://jamstack.org
[ghost cms]: https://ghost.org
[build workflow]:
  https://github.com/BlakeRain/blakerain.com/blob/master/.github/workflows/deploy-static-site.yml
