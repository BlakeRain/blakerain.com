const GhostAdminAPI = require("@tryghost/admin-api");
const yaml = require("yaml");
const fs = require("fs");
const http = require("http");
const https = require("https");
const Stream = require("stream").Transform;
const url = require("url");
const path = require("path");

function getAdminAPI() {
  const key = process.env.GHOST_ADMIN_API_KEY;
  if (typeof key === "undefined") {
    throw new Error("Expected environment variable 'GHOST_ADMIN_API_KEY'");
  }

  return new GhostAdminAPI({
    url: process.env.GHOST_HOSTNAME || "localhost",
    key: key,
    version: "v3",
  });
}

function download(url, filename) {
  url = url.replace("http://localhost:2368", process.env.GHOST_HOSTNAME);
  console.log(`Downloading: ${url}`);
  (url.startsWith("https") ? https : http)
    .request(url, function (response) {
      var data = new Stream();

      response.on("data", function (chunk) {
        data.push(chunk);
      });

      response.on("end", function () {
        fs.writeFileSync(filename, data.read());
      });
    })
    .end();
}

function processMobileDoc(slug, doc) {
  var parts = [];
  var stack = [];

  function getMarkupAttributes(markup) {
    const attr_list = markup[1] || [];
    const attributes = {};

    for (let i = 0; i < attr_list.length; i += 2) {
      attributes[attr_list[i]] = attr_list[i + 1];
    }

    return attributes;
  }

  function parseMarkup(markup) {
    return {
      tag: markup[0],
      attrs: getMarkupAttributes(markup),
    };
  }

  function mapMarkup(markup) {
    const { tag, attrs } = parseMarkup(markup);

    switch (tag) {
      case "code":
        return ["`", "`"];
      case "em":
        return ["_", "_"];
      case "strong":
        return ["**", "**"];
      case "sup":
        return ["<sup>", "</sup>"];
      case "a":
        return ["[", `](${attrs["href"]})`];
      default:
        console.error(`Unrecognized markup: ${markup}`);
    }
  }

  function processTextMarker(marker) {
    for (var opener of marker[1]) {
      const [open, close] = mapMarkup(doc.markups[opener]);
      parts.push(open);
      stack.push(close);
    }

    parts.push(marker[3]);
    while (marker[2]-- > 0) {
      const top = stack.pop();
      if (!top) {
        throw new Error("Attempted to pop empty render stack");
      }
      parts.push(top);
    }
  }

  function processAtomMarker(marker) {
    console.error(`Unable to process atom marker for atom: '${marker[3]}'`);
    console.log(doc.atoms[marker[3]]);
  }

  function processMarkers(markers) {
    markers.forEach((marker) => {
      switch (marker[0]) {
        case 0:
          processTextMarker(marker);
          break;
        case 1:
          processAtomMarker(marker);
          break;
        default:
          console.error(`Unrecognized marker code: ${marker[0]}`);
          break;
      }
    });
  }

  function processMarkup(section) {
    switch (section[1]) {
      case "h1":
      case "h2":
      case "h3":
      case "h4":
      case "h5":
      case "h6":
        parts.push(
          Array(1 + parseInt(section[1].substr(1)))
            .fill("#")
            .join("") + " "
        );
        processMarkers(section[2]);
        parts.push("\n\n");
        break;
      case "blockquote":
        parts.push("> ");
        processMarkers(section[2]);
        parts.push("\n\n");
        break;
      case "p":
        processMarkers(section[2]);
        parts.push("\n\n");
        break;
      default:
        console.error(`Unrecognized markup section tag: '${section[1]}'`);
        break;
    }
  }

  function processList(section) {
    const code = { ol: "1. ", ul: "- " }[section[1]];
    section[2].forEach((markers) => {
      parts.push(code);
      processMarkers(markers);
      parts.push("\n");
    });

    parts.push("\n");
  }

  function processBookmarkCard(card) {
    parts.push("```bookmark\n");
    parts.push(yaml.stringify(card));
    parts.push("```\n\n");
  }

  function processCodeCard(card) {
    parts.push("```" + card.language);
    if ("caption" in card) {
      parts.push(` {"caption": "${card.caption}"}`);
    }
    parts.push("\n");
    parts.push(card.code);
    if (!card.code.endsWith("\n")) {
      parts.push("\n");
    }
    parts.push("```\n\n");
  }

  function processHtmlCard(card) {
    parts.push("```raw_html\n");
    parts.push(card.html);
    if (!card.html.endsWith("\n")) {
      parts.push("\n");
    }
    parts.push("```\n\n");
  }

  function processImageCard(card) {
    const params = new URLSearchParams();

    if ("cardWidth" in card) {
      switch (card.cardWidth) {
        case "full":
          params.set("full", "");
          break;
        case "wide":
          params.set("wide", "");
          break;
      }
    }

    if ("width" in card) {
      params.set("width", card.width);
    }

    if ("height" in card) {
      params.set("height", card.height);
    }

    if ("caption" in card) {
      params.set("caption", card.caption);
    }

    const name = path.basename(card.src);
    download(card.src, path.join("public", "content", slug, name));

    const qs = params.toString();
    parts.push(
      `![${card.caption}](${path.join("content", slug, name)}${
        qs.length > 0 ? "?" + qs : ""
      })\n\n`
    );
  }

  function processMarkdownCard(card) {
    parts.push(card.markdown);
    if (!card.markdown.endsWith("\n")) {
      parts.push("\n");
    }
    parts.push("\n");
  }

  function processCard(section) {
    const card = doc.cards[section[1]];

    switch (card[0]) {
      case "bookmark":
        processBookmarkCard(card[1]);
        break;
      case "code":
        processCodeCard(card[1]);
        break;
      case "html":
        processHtmlCard(card[1]);
        break;
      case "image":
        processImageCard(card[1]);
        break;
      case "markdown":
        processMarkdownCard(card[1]);
        break;
      default:
        console.error(`Unrecognized card type '${card[0]}'`);
    }
  }

  function processSection(section) {
    switch (section[0]) {
      case 1:
        processMarkup(section);
        break;
      case 3:
        processList(section);
        break;
      case 10:
        processCard(section);
        break;
      default:
        console.error(`Unrecognized section ID: ${section[0]}`);
        break;
    }
  }

  for (let section of doc.sections) {
    processSection(section);
  }

  return parts.join("");
}

const args = process.argv.slice(2);

if (args[0] === "post") {
  if (args.length !== 2) {
    console.error("Expected path to JSON file after 'post' argument");
  }

  const post = JSON.parse(fs.readFileSync(args[1]));
  console.log(`Processing post: ${post.slug}`);

  const front_matter = {
    slug: post.slug,
    title: post.title,
    tags: [],
  };

  if (post.custom_excerpt) {
    front_matter.excerpt = post.custom_excerpt;
  }

  if (post.published_at) {
    front_matter.published = post.published_at;
  } else {
    front_matter.draft = true;
  }

  const content = processMobileDoc(
    post.slug,
    JSON.parse(post.mobiledoc),
    false
  );
  process.stdout.write(
    "---\n" + yaml.stringify(front_matter) + "---\n\n" + content
  );
} else if (args[0] === "ghost") {
  ghost = getAdminAPI();

  ghost.tags.browse({ limit: "all" }).then((tags) => {
    const our_tags = tags
      .filter((tag) => !tag.name.startsWith("#"))
      .map((tag) => {
        const our_tag = {
          slug: tag.slug,
          name: tag.name,
          visibility: "public",
        };

        if (tag.description) {
          our_tag.description = tag.description;
        }

        return our_tag;
      });

    const tags_dict = {};
    our_tags.forEach((tag) => {
      tags_dict[tag.slug] = tag;
    });

    const content = yaml.stringify(tags_dict);
    fs.writeFileSync("content/tags.yaml", "#\n# tags.yaml\n#\n\n" + content);
    console.log(`Extracted ${our_tags.length} tags (of ${tags.length})`);
  });

  ghost.pages.browse({ limit: "all" }).then((pages) => {
    pages.forEach((page) => {
      console.log(`Processing page: ${page.slug}`);
      const front_matter = {
        slug: page.slug,
        title: page.title,
        published: page.published_at,
      };

      if (page.custom_excerpt) {
        front_matter.excerpt = page.custom_excerpt;
      }

      fs.writeFileSync(
        `content/pages/${page.slug}.md`,
        "---\n" +
          yaml.stringify(front_matter) +
          "---\n\n" +
          processMobileDoc(page.slug, JSON.parse(page.mobiledoc))
      );
    });
  });

  ghost.posts.browse({ limit: "all" }).then((posts) => {
    posts
      .filter((post) => post.status === "published")
      .forEach((post) => {
        console.log(`Processing post: ${post.slug}`);
        const front_matter = {
          slug: post.slug,
          title: post.title,
          tags: post.tags
            .filter((tag) => !tag.slug.startsWith("hash-"))
            .map((tag) => tag.slug),
        };

        if (post.custom_excerpt) {
          front_matter.excerpt = post.custom_excerpt;
        }

        if (post.published_at) {
          front_matter.published = post.published_at;
        } else {
          front_matter.draft = true;
        }

        if (post.feature_image) {
          const filename = path.basename(
            url.parse(post.feature_image).pathname
          );
          front_matter.cover = "/content/" + filename;
          download(post.feature_image, "public/content/" + filename);
        }

        if (!fs.existsSync(path.join("public", "content", post.slug))) {
          fs.mkdirSync(path.join("public", "content", post.slug));
        }

        const content = processMobileDoc(post.slug, JSON.parse(post.mobiledoc));
        fs.writeFileSync(
          `content/posts/${post.slug}.md`,
          "---\n" + yaml.stringify(front_matter) + "---\n\n" + content
        );
      });
  });
} else {
  console.error("Expected either 'ghost' or 'post' argument");
}
