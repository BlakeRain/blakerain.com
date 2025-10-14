---
title: Changelog
summary: A log of changes made to this website.
menus:
  - footer_right
params:
  icon: { vendor: "bootstrap", name: "journal-text" }
---

# 2025-10-14

- Added the [BibTeX to Markdown](/tools/standalone/bibtex-to-markdown) converter created by [Claude
  Code](https://github.com/anthropics/claude-code) to the [tools](/tools) page.

# 2025-10-08

- Added back the [tools](/tools) page with a new style.
- Added the [.mobileconfig generator](/tools/generate-mobileconfig) tool.
- Added the [generate TOTP](/tools/standalone/generate-totp) tool.
- Added the [fetchmail configuration generator](/tools/standalone/generate-fetchmail) tool.
- Added the [RR demonstrator](/tools/rr-and-risk) tool.
- Fixed incorrect link to the [status page](https://status.blacktreenetworks.com) in the footer, now
  that the site has moved domain.

# 2025-08-29

- Added [An Almost Anonymous Blog](https://lwgrs.bearblog.dev/) to the [blogroll](/blogroll).
- Added [Steph Ango](https://stephango.com/)'s site to the [blogroll](/blogroll).
- [Notes](/notes) now render as individual pages, and the notes list now includes "self links" with
  each note.
- Added [Bitnami are shutting down their Docker images](2025-08-29.md) note.

# 2025-08-26

This evening was spent adding some [slash pages](https://slashpages.net/) to the site.

- Added [/blank](/blank) page. Intentionally left blank.
- Added the [/blogroll](/blogroll) page, listing other sites that I read and recommend.
- I removed the `/tools` page, as it was just a single tool that I no longer maintain or use.
- Added [/hosting](/hosting) page, listing things I self-host.
- Added the last four blog posts to the bottom of the homepage.

[git log]: https://git.blakerain.com/BlakeRain/blakerain.com/commits/branch/main

# 2025-08-23

- Added the [uses](/uses) page listing the hardware and software I use.
- Reworked the menus and the footer links. Links are now on both sides.
- Headings now have anchor links (indicated by a `#` symbol that appears on hover).

# 2025-08-22

- Workflows now run [Forgejo](https://forgejo.org/) self-hosted runner. This means the `.github`
  directory has been replaced with a `.forgejo` directory.
- Added the self-hosted [Forgejo](https://git.blakerain.com/BlakeRain) link to the header.

