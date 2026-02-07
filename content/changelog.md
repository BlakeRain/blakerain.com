---
title: Changelog
summary: A log of changes made to this website.
menus:
  - footer_right
params:
  icon: { vendor: "bootstrap", name: "journal-text" }
sitemap:
  disable: true
---

# 2026-02-07

- Updated some of the [tag](/tags) descriptions.
- Fixed the [tags](/tags) page to be more responsive.
- Tidied up the index page to use less elements.

# 2026-02-05

- Added various [IndieWeb](https://indieweb.org/) markdown to the site.
- Fixed the overflow of tables pushing content out of viewport on mobile.
- Removed the `bookmark` shortcode in favour of simpler links.
- Refactored some of the partials to simplify the template code.

# 2026-02-03

- Removed references to Bluesky.
- Restored the time at which a post was published (no longer just the date).
- Tidied up and published the post about [summarisation](/blog/i-dont-like-automatic-summarisation).
- Fixed the missing margin at the bottom of tables.

# 2026-02-02

- Added the latest notes to the homepage.
- Fixed the leading of headings in blog and notes.

# 2026-01-23

- Fixed the color of `<strong>` in markdown in dark mode.
- Fixed various spelling mistakes.
- Changed the RSS feed link in the footer to the new combined feed.
- Added a combined feed for both blog posts and nosts.
- Fixed heading width in blog and notes.

# 2026-01-08

- Migrated to [Hugo v0.154.0](https://github.com/gohugoio/hugo/releases/tag/v0.154.0). This mostly
  involved changing the `layouts` directory structure to the
  [new one](https://gohugo.io/templates/new-templatesystem-overview/).
- Added [tags](/tags) to the [notes](/notes). I also changed the rendering of an individual note
  page to include some metadata: date, tags, and reading time. This brings the notes somewhat more
  in line with blog posts.
- I updated the [OPML feed](/downloads/feeds.opml.xml) to include new feeds that I follow.
- Added a post for the [Album of the Year 2025](/blog/album-of-the-year-2025).
- Include full post content in the RSS feed.

# 2025-12-28

- Added some more blogs to the [blogroll](/blogroll), and a link to the OPML file for the full list
  of feeds I follow.
- Added some more software and services to the [uses](/uses) and [hosting](/hosting) pages.

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
- Started the changelog.
