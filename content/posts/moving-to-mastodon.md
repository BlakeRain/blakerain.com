---
title: Moving to Mastodon
tags:
  - mastodon
published: 2022-11-13T15:38:33.000Z
cover: /content/moving-to-mastodon/cover.jpg
excerpt: |
  Much like a great number of other people, I have followed the trend towards Mastodon, and have
  found it to be quite a wonderful experience.
---

This week one of my favourite actors [Stephen Fry] posted a final message to his now closed Twitter account and moved
over to the [Mastodon] social network. I first learned about Fry's move when the news showed up on a [Reddit post] on
`r/entertainment` showing his last tweet: the message "Goodbye", written in scrabble tiles.

![Stephen Fry says Goodbye](/content/moving-to-mastodon/fry-scrabble.jpg)

It seems that Fry subsequently deleted his Twitter account, leaving behind some twelve million followers, of which I was
one. I remember that Fry was one of the early adopters of Twitter, and I've always enjoyed his content, even though his
tweets were at times few and far between.

In the same Reddit thread I learned that he had already created an account on the [mastodonapp.uk] instance where, at
the time of writing, he has already amassed 51k followers.

```bookmark
url: "https://mastodonapp.uk/@stephenfry"
title: "@stephenfry@mastodonapp.uk"
description: Stephen Fry on Mastodon
author: Stephen Fry
publisher: Mastodon
thumbnail: "/content/moving-to-mastodon/fry-mastodon.jpg"
icon: "https://cdn.simpleicons.org/mastodon/6364FF"
```

Not wanting to be left out of what appeared to be a growing trend, Fry's departure from Twitter provided the impetus for
me to give Mastodon a go. On Wednesday I decided to create my own Mastodon account, on the same [mastodonapp.uk]
instance.

# First Impressions of Mastodon

The content that I'm seeing on Mastodon is, for now, really quite lovely. Seeing the updates from [Wild1145] (the site
owner of the mastodonapp.uk instance) has been fascinating. He has been routinely tooting updates, along with CloudFlare
stats showing the growth of traffic to the instance. I feel that these kind of interactions bring us much closer to the
administrators, and really builds on the feeling of community.

Wild1145 was also invited onto [Times Radio] the same morning that I signed up. Scrub to position 1:56:00 to hear the
interview. It was awesome to actually hear from him on the same day that I was creating my account.

Another fun discovery was the reporting every hour by [@mastodonusercount@bitcoinhackers.org], showing the increasing
number of Mastodon users. At the time of writing this, on a rather lazy Sunday morning, this bot is reporting that over
sixty thousand new users have been added in the past 24 hours.

![Increasing Mastodon Accounts](/content/moving-to-mastodon/example-user-count.jpg)

Getting a handle on how Mastodon works was quite easy: there are a lot of resources that explain how to use the Mastodon
web interface, and the generally accepted behaviour. Detailed information on how to use and operate Mastodon, including
hosting your own instances, can be found in the [Mastodon Documentation]. The [GuideToMastodon] repository has some
awesome information that I found useful.

# Reaction by the Community

Something that has made me consider how we should be behaving on Mastoodon has been the reactions from the existing
Mastodon users, prior to this influx of users from Twitter. To be honest, I cannot recall ever seeing any mention in the
media about how the existing Mastodon users have reacted.

Rummaging around on the Internet made me think that the reaction by the community seems to be a mix of trepidation,
excitement, and resentment. I've found some people who are quite vocal in their dismay at the behaviour of people
de-platforming from Twitter and onto Mastodon. I think we should be listening to these people quite a bit more.

One of the people I found was Hugh Rundle. Hugh has made some interesting points in his post [Home Invasion], which I
think is an important read to anybody moving to Mastodon from Twitter. Hugh tells an important part of the story that
I'm not sure is being considered.

```quote
author: Hugh Rundle
url: "https://www.hughrundle.net/home-invasion/"
quote: |
    There's another, smaller group of people mourning a social media experience that was destroyed this week — the people
    who were active on Mastodon and the broader fediverse prior to November 2022. The nightclub has a new brash owner, and
    the dancefloor has emptied. People are pouring in to the quiet houseparty around the corner, cocktails still in hand,
    demanding that the music be turned up, walking mud into the carpet, and yelling over the top of the quiet conversation.
```

I really hope that we can behave in a way that doesn't ruin the house party.

# Verified Links in Account Profiles

A nice feature of Mastodon is that it provides a simple means of [verifying] that a link in someone's profile
corresponds to their Mastodon account (without paying $8). For example, on my Mastodon profile the link to this website
has a green check, as my website has a link back to my Mastodon profile.

![Verified Website in Mastodon Profile](/content/moving-to-mastodon/verified-website.jpg)

This was achieved by adding a `rel="me"` to the anchor that links back to my Mastodon profile in the navigation header
at the top of this site:

```typescript
const MastodonLink: FC = () => {
  return (
    <a
      href="https://mastodonapp.uk/@BlakeRain"
      title="@BlakeRain@mastodonapp.uk"
      target="_blank"
      rel="me noreferrer"
    >
      <Mastodon />
    </a>
  );
};
```

This is a much simpler approach to verifying an account, and perhaps offers some small defence against imitators that
doesn't rely on any centralised verification. Of course, there's nothing stopping an imitator from validating their
account against their own website.

# Final Thoughts

For people not familiar with such things, I think it's fairly important to understand that: a) Mastodon itself is an
open-source project rather than a closed-source product like Twitter, and b) Mastodon is a _decentralised_ social
network.

As an open-source project, where the [source code] is available on GitHub, Mastodon is developed mostly by volunteers
rather than entirely by a large corporation. Depending on your point of view, this can be a blessing or a curse, or
perhaps a bit of both.

Being decentralised means that Mastodon has exchanged a set of risks associated with centralisation for a different set
of risks. Mastodon instances are mostly run by volunteers, and as such can face a variety of issues such as lack of
funding, varying degrees of moderation, and the potential to go offline with little to no notice.

Mastodon uses the [ActivityPub] protocol which, I was happy to discover, is a W3C recommended standard. Unfortunately it
seems that [Bluesky], another distributed social protocol that was founded by Twitter, will not be adopting ActivityPub,
preferring their own [AT Protocol].

According to the ActivityPub specification, servers running the protocol communicate to each other using a specific
server-to-server protocol, also called the "Federation Protocol". One advantage of this approach is that it allows
administrators to "defederate" other parts of the network.

A simple example of this might be an administrator finding that they are receiving a large number of reports for toots
coming from another instance. It might be that this other instance lacks moderation, or employs a model of moderation
that is incompatible with those maintained by the administrator. In this case, the administrator can block the domain of
the offending instance, as such blocking content from that instance.

One risk here might be that users find themselves isolated from the larger networks due to the behaviour of others on
their instance, or even the actions of their administrator(s). Of course, there is nothing stopping a user from moving
to another instance, but users might find this frustrating.

Some instances share their block list. For example, the [chaos.social] instance share their [block list] on GitHub.
Tools exist to facilitate this, such as the [mastodon-defederate] tool, which parses block lists from other servers or
from Markdown documents.

It is not clear to me how one would discover when or if an instance has been blocked. Without any form of
centralisation, defederation becomes entirely at the mercy of instance administrators. A more coordinated defederation
mechanism, such as one that operates by consensus across a network, might go some way to ease the propagation of block
lists and increase transparency.

[stephen fry]: https://en.wikipedia.org/wiki/Stephen_Fry
[mastodon]: https://joinmastodon.org
[reddit post]: https://www.reddit.com/r/entertainment/comments/yqfkne/stephen_fry_joins_celebrity_twitter_exodus_says/
[mastodonapp.uk]: https://mastodonapp.uk
[wild1145]: https://mastodonapp.uk/@wild1145
[times radio]: https://www.thetimes.co.uk/radio/show/20221109-11630/2022-11-09
[@mastodonusercount@bitcoinhackers.org]: https://bitcoinhackers.org/@mastodonusercount
[achieved]: https://github.com/BlakeRain/blakerain.com/blob/aa9d84610fef9640d7da45af93f74a38139b35b0/components/Navigation.tsx#L81-L92k
[mastodon documentation]: https://docs.joinmastodon.org
[guidetomastodon]: https://github.com/joyeusenoelle/GuideToMastodon
[home invasion]: https://www.hughrundle.net/home-invasion/
[source code]: https://github.com/mastodon/mastodon
[activitypub]: https://activitypub.rocks
[bluesky]: https://blueskyweb.org
[at protocol]: https://atproto.com/docs
[block list]: https://raw.githubusercontent.com/chaossocial/about/master/blocked_instances.md
[chaos.social]: https://chaos.social/about
[mastodon-defederate]: https://github.com/Anthchirp/mastodon-defederate
[verifying]: https://docs.joinmastodon.org/user/profile/
