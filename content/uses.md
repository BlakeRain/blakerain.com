---
title: Uses
date: 2025-08-21T19:44:30
summary: A list of hardware and software I use.
subtitle: true
menus:
  - footer_left
params:
  icon: { vendor: "bootstrap", name: "pc" }
---

This page lists the software and development tools that I use on a regular basis. You might also be
interested in my [self hosting](/hosting) page that lists what services I self-host.

# Software

- [1Password] - My preferred password manager.
- [Bitwarden] - My other password manager.
- [Feishin] - A cross-platform desktop client for Subsonic.
- [Firefox] - My main web browser on MacOS and Linux. Specifically I use the [developer edition].
- [LibreOffice] - A great open-source office suite.
- [Navidrome] - A self-hosted music server. I use this instead of Spotify or Apple Music.
- [NetNewsWire] - An RSS reader for iOS and macOS.
- [Obsidian] - Note-taking and PKM application.
- [SearXNG] - A self-hosted search engine. Used as my default on all devices where I have a choice.
- [Syncthing]  - For syncing files between devices.
- [Thunderbird] - A FOSS email client.
- [Zotero] - A tool for managing your research library.

## MacOS and iOS Specific

- [Easy Move+Resize] - Move and resize windows on MacOS like you're using a normal OS.
- [HammerSpoon] - Utility for automating MacOS, useful for emulating some of the features I miss
  from Linux desktop environments. Unfortunately I'm only using this for [launching terminals] these
  days.
- [Mona] - iOS client for [Mastodon].
- [Raycast] - Application launcher for MacOS.

# Development

- [Atuin] - Share my shell history across devices. I self-host the sync server.
- [Konsole] - The terminal I use on Linux.
- [Neovim] - My main text editor. You can find my [neovim config] in my [dotfiles].
- [Tmux] - Terminal multiplexer, I use this all the time.
- [Wezterm] - The terminal I use on MacOS (thanks [@wez](https://github.com/wez)).
- [yazi] - A terminal-based file manager that I've recently adopted.
- [zsh] - My shell of choice. My [zhrc] is in my [dotfiles].

# Services

Paid services that I use for various bits and pieces. Some of these services are used for
self-hosting. If you're interested, I provide a [self-hosting](/hosting) page that lists what
services I self-host.

- [Bunny](https://bunny.net/) - A European [CDN] service that is expanding to include a number of
  other useful edge services.
- [Hetzner](https://www.hetzner.com/) - A provided of various dedicated and cloud services. I mostly
  use their fantastic [dedicated servers](https://www.hetzner.com/dedicated-rootserver/) and their
  [Storage Box](https://www.hetzner.com/storage/storage-box/).
- [Proton](https://proton.me/) - Email and VPN services. Whilst I self-host my email, I keep Proton
  around for all their other services.

# Browser Extensions

Apart from the usual extensions like password managers, there are some extensions that I think you
might want to consider. As I've been move away from Firefox, I've started to split this list into
two sections: one for Chromium and one for Firefox.

## Chromium

- [Blog Quest (Chrome)] - Silently collects RSS feeds as you browse the internet.
- [Consent-O-Matic (Chrome)] - A Chrome extension that automatically handles GDPR consent forms.
- [Dark Reader (Chrome)] - Dark mode for Chrome.
- [Linkding Extension (Chrome)] - Companion extension to [Linkding](https://linkding.link/).
- [Mastodon Redirector (Chrome)] - Redirects Mastodon links to a Mastodon instance of your choice,
  saving you from having to search the username on your instance.
- [Obsidian Web Clipper (Chrome)] - An extension that lets you highlight and extract content from a
  web page into your [Obsidian] vault.
- [Readeck (Chrome)] - Extension that extracts content into [Readeck](https://readeck.org/en/). I
  used this to add content to my [self-hosted](/hosting) instance of Readeck.
- [Single File (Chrome)] - A Chrome extension that lets you download a whole page and all its assets
  as a single HTML file. I typically use this to download a single-page archive to then upload to my
  [archivebox](https://archivebox.io/) instance.
- [StreetPass (Chrome)] - Monitors sites that you visit and silently collects Mastodon profiles.
- [TubeArchivist (Chrome)] - A Chrome extension for interacting with a self-hosted
  [TubeArchivist](https://www.tubearchivist.com/)
- [uBlock Origin Lite] - Blocks ads and trackers. This is an MV3-based form of the original [uBlock
  Origin].
- [Vimium (Chrome)] - Adds Vim-like key bindings to Chromium.
- [Zotero Connector (Chrome)] - A Chrome extension that eases adding content to Zotero.

## Firefox Extensions

- [Blog Quest (Firefox)] - Silently collects RSS feeds as you browse the internet.
- [Dark Reader (Firefox)] - Dark mode for Firefox.
- [Linkding Extension (Firefox)] - Companion extension to [Linkding](https://linkding.link/).
- [Mastodon Redirector (Firefox)] - Redirects Mastodon links to a Mastodon instance of your choice,
  saving you from having to search the username on your instance.
- [Obsidian Web Clipper (Firefox)] - An extension that lets you highlight and extract content from a
  web page into your [Obsidian] vault.
- [Readeck (Firefox)] - Extension that extracts content into [Readeck](https://readeck.org/en/). I used this
  to add content to my [self-hosted](/hosting) instance of Readeck.
- [StreetPass (Firefox)] - Monitors sites that you visit and silently collects Mastodon profiles.
- [uBlock Origin] - A well-known content blocker for Firefox.
- [Vimium (Firefox)] - Adds Vim-like key bindings to Firefox.
- [Zotero Connector] - A Firefox extension that eases adding content to Zotero.

[CDN]: https://en.wikipedia.org/wiki/Content_delivery_network

[1Password]: https://1password.com/
[Bitwarden]: https://bitwarden.com/
[Feishin]: https://github.com/jeffvli/feishin
[Firefox]: https://www.firefox.com/en-GB/
[developer edition]: https://www.firefox.com/en-GB/channel/desktop/developer/
[Easy Move+Resize]: https://github.com/dmarcotte/easy-move-resize
[HammerSpoon]: https://www.hammerspoon.org/
[LibreOffice]: https://www.libreoffice.org/
[Mona]: https://getmona.app/
[Navidrome]: https://www.navidrome.org/
[NetNewsWire]: https://netnewswire.com/
[Obsidian]: https://obsidian.md/
[Raycast]: https://www.raycast.com/
[SearXNG]: https://github.com/searxng/searxng
[Syncthing]: https://syncthing.net/
[Thunderbird]: https://www.thunderbird.net/
[Zotero]: https://www.zotero.org/

[Blog Quest (Chrome)]: https://chromewebstore.google.com/detail/blog-quest/ghmfhadmoephkndjiahchiobgclmkkpi
[Blog Quest (Firefox)]: https://addons.mozilla.org/en-US/firefox/addon/blog-quest/
[Consent-O-Matic (Chrome)]: https://chromewebstore.google.com/detail/consent-o-matic/mdjildafknihdffpkfmmpnpoiajfjnjd
[Dark Reader (Chrome)]: https://chromewebstore.google.com/detail/dark-reader/eimadpbcbfnmbkopoojfekhnkhdbieeh
[Dark Reader (Firefox)]: https://addons.mozilla.org/en-US/firefox/addon/darkreader/
[Linkding Extension (Chrome)]: https://chromewebstore.google.com/detail/linkding-extension/beakmhbijpdhipnjhnclmhgjlddhidpe
[Linkding Extension (Firefox)]: https://addons.mozilla.org/en-US/firefox/addon/linkding-extension/
[Mastodon Redirector (Chrome)]: https://chromewebstore.google.com/detail/mastodon-redirector/limifnkopacddgpihodacjeckfkpbfoe
[Mastodon Redirector (Firefox)]: https://addons.mozilla.org/en-US/firefox/addon/mastodon-profile-redirect/
[Obsidian Web Clipper (Chrome)]: https://chromewebstore.google.com/detail/obsidian-web-clipper/cnjifjpddelmedmihgijeibhnjfabmlf
[Obsidian Web Clipper (Firefox)]: https://obsidian.md/clipper
[Readeck (Chrome)]: https://chromewebstore.google.com/detail/readeck/jnmcpmfimecibicbojhopfkcbmkafhee
[Readeck (Firefox)]: https://addons.mozilla.org/en-US/firefox/addon/readeck/
[Single File (Chrome)]: https://chromewebstore.google.com/detail/singlefile/mpiodijhokgodhhofbcjdecpffjipkle
[StreetPass (Chrome)]: https://chromewebstore.google.com/detail/streetpass-for-mastodon/fphjfedjhinpnjblomfebcjjpdpakhhn
[StreetPass (Firefox)]: https://addons.mozilla.org/en-US/firefox/addon/streetpass-for-mastodon/
[Tube Archivist (Chrome)]: https://chromewebstore.google.com/detail/tubearchivist-companion/jjnkmicfnfojkkgobdfeieblocadmcie
[uBlock Origin]: https://addons.mozilla.org/en-US/firefox/addon/ublock-origin/
[uBlock Origin Lite]: https://chromewebstore.google.com/detail/ublock-origin-lite/ddkjiahejlhfcafbddmgiahcphecmpfh
[Vimium (Chrome)]: https://chromewebstore.google.com/detail/vimium/dbepggeogbaibhgnhhndojpepiihcmeb
[Vimium (Firefox)]: https://addons.mozilla.org/en-US/firefox/addon/vimium-ff/?utm_content=addons-manager-reviews-link/
[Zotero Connector]: https://www.zotero.org/
[Zotero Connector (Chrome)]: https://chromewebstore.google.com/detail/zotero-connector/ekhagklcjbdpajgpjgmbionohlpdbjgc

[launching terminals]: https://git.blakerain.com/BlakeRain/dotfiles/src/commit/65f74dbc00c90a826df8fee8c93a4717f8ea2007/hammerspoon/init.lua#L5
[mastodon]: https://joinmastodon.org/

[atuin]: https://atuin.sh/
[konsole]: https://konsole.kde.org/
[dotfiles]: https://git.blakerain.com/BlakeRain/dotfiles
[neovim]: https://neovim.io/
[Tmux]: https://github.com/tmux/tmux
[Wezterm]: https://wezterm.org/
[yazi]: https://yazi-rs.github.io/
[zsh]: https://www.zsh.org/

[neovim config]: https://git.blakerain.com/BlakeRain/dotfiles/src/branch/main/nvim
[zshrc]: https://git.blakerain.com/BlakeRain/dotfiles/src/branch/main/zshrc
