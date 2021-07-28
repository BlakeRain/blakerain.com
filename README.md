# blakerain.com

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
