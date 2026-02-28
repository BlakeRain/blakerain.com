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
- [Bitwarden] - My other password manager. [{{< ico bootstrap github >}}](https://github.com/bitwarden)
- [Easy Move+Resize] - Move and resize windows on MacOS like you're using a normal OS.
- [Feishin] - A cross-platform desktop client for Subsonic.
- [Firefox] - My main web browser on MacOS and Linux. Specifically I use the [developer edition].
  [hg](https://hg-edge.mozilla.org/mozilla-central/)
- [HammerSpoon] - Utility for automating MacOS, useful for emulating some of the features I miss
  from Linux desktop environments. Unfortunately I'm only using this for [launching terminals] these
  days. [{{< ico bootstrap github >}}](https://github.com/Hammerspoon/hammerspoon)
- [LibreOffice] - A great open-source office suite.
- [Mona] - iOS client for [Mastodon].
- [Navidrome] - A self-hosted music server. I use this instead of Spotify or Apple Music. [{{< ico bootstrap github >}}](https://github.com/navidrome/navidrome/)
- [NetNewsWire] - An RSS reader for iOS and macOS. [{{< ico bootstrap github >}}](https://github.com/Ranchero-Software/NetNewsWire)
- [Obsidian] - Note-taking and PKM application.
- [Raycast] - My application launcher of choice on MacOS.
- [SearXNG] - A self-hosted search engine. Used as my default on all devices where I have a choice.
  [{{< ico bootstrap github >}}](https://github.com/searxng/searxng/tree/master)
- [Syncthing]  - For syncing files between devices. [{{< ico bootstrap github >}}](https://github.com/syncthing/syncthing)
- [Thunderbird] - A FOSS email client. [hg](https://hg-edge.mozilla.org/comm-central/)
- [Zotero] - A tool for managing your research library. [{{< ico bootstrap github >}}](https://github.com/zotero/zotero)

# Development

- [Atuin] - Share my shell history across devices. I self-host the sync server.
- [Konsole] - The terminal I use on Linux.
- [Neovim] - My main text editor. You can find my [neovim config] in my [dotfiles].
- [Tmux] - Terminal multiplexer, I use this all the time.
- [Wezterm] - The terminal I use on MacOS (thanks [@wez](https://github.com/wez)).
- [yazi] - A terminal-based file manager that I've recently adopted.
- [zsh] - My shell of choice. My [zhrc] is in my [dotfiles].

# Services

- [Readwise Reader](https://readwise.io/read) - Reading and highlighting. Works well with Obsidian.
  I may end up dropping this in favour of [Readeck](https://readeck.org/en/), but not due to any
  fault of Readwise.
- [Proton](https://proton.me/) - Email and VPN services. Whilst I self-host my email, I keep Proton
  around for all their other services.

# Firefox Extensions

- [Blog Quest] - Silently collects RSS feeds as you browse the internet.
  [{{< ico bootstrap github >}}](https://github.com/robalexdev/blog-quest).
- [Linkding Extension] - Companion extension to [Linkding](https://linkding.link/).
  [{{< ico bootstrap github >}}](https://github.com/sissbruecker/linkding-extension/)
- [Dark Reader] - Dark mode for Firefox.
  [{{< ico bootstrap github >}}](https://github.com/darkreader/darkreader)
- [Mastodon Redirector] - Redirects Mastodon links to a Mastadon instance of your choice, saving you
  from having to search the username on your instance.
  [{{< ico bootstrap github >}}](https://github.com/bramus/mastodon-redirector)
- [Obsidian Web Clipper] - An extension that lets you highlgith and extract content from a web page
  into your [Obsidian] vault.
- [Readeck] - Extension that extracts content into [Readeck](https://readeck.org/en/). I used this
  to add content to my [self-hosted](/hosting) instance of Readeck.
- [StreetPass] - Monitors sites that you visit and silently collects Mastodon profiles.
  [{{< ico bootstrap github >}}](https://github.com/tvler/streetpass)
- [uBlock Origin] - A well-known content blocker for Firefox.
- [Vimium] - Adds Vim-like key bindings to Firefox.
  [{{< ico bootstrap github >}}](https://github.com/philc/vimium)
- [Zotero Connector] - A Firefoaax extension that eases adding content to Zotero.

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

[Blog Quest]: https://addons.mozilla.org/en-US/firefox/addon/blog-quest/
[Dark Reader]: https://addons.mozilla.org/en-US/firefox/addon/darkreader/
[Linkding Extension]: https://addons.mozilla.org/en-US/firefox/addon/linkding-extension/
[Mastodon Redirector]: https://addons.mozilla.org/en-US/firefox/addon/mastodon-profile-redirect/
[Obsidian Web Clipper]: https://obsidian.md/clipper
[Readeck]: https://addons.mozilla.org/en-US/firefox/addon/readeck/
[StreetPass]: https://addons.mozilla.org/en-US/firefox/addon/streetpass-for-mastodon/
[uBlock Origin]: https://addons.mozilla.org/en-US/firefox/addon/ublock-origin/
[Vimium]: https://addons.mozilla.org/en-US/firefox/addon/vimium-ff/?utm_content=addons-manager-reviews-link/
[Zotero Connector]: https://www.zotero.org/

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
