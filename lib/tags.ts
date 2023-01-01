import { promises as fs } from "fs";
import path from "path";
import yaml from "yaml";

/// The ID (slug) of a tag.
export type TagId = string;

/// Represents a tag.
export interface Tag {
  /// The ID (slug) of the tag.
  slug: TagId;
  /// The title of the tag.
  name: string;
  /// Whether the tag is visible or not (only public tags are shown).
  visibility?: "public" | "private";
  /// A quick description of the tag.
  description?: string;
}

/// A mapping from a `TagId` to a `Tag`.
export type Tags = Map<TagId, Tag>;

/// Load the tags from the `/contents/tags.yaml` file.
///
/// Each entry in the `tags.yaml` file describes a tag for the site. Each tag can have the following fields:
///
/// 1. A `slug` field, which overrides the name used in the YAML dictionary,
/// 2. A `name` field, which is used as the title of the tag. If no `name` is given, the slug is used instead.
/// 3. The `visibility` of the tag. If missing, the visibility is assumed to be `"public"`.
/// 4. Any `description` for the tag.
export async function loadTags(): Promise<Tags> {
  const tagsPath = path.join(process.cwd(), "content", "tags.yaml");
  const tagsSrc = await fs.readFile(tagsPath, "utf-8");
  const tags = yaml.parse(tagsSrc) as { [key: string]: Tag };
  const res: Tags = new Map();

  Object.keys(tags).forEach((tag_id) => {
    const tag = tags[tag_id];

    if (!tag.slug) {
      tag.slug = tag_id;
    }

    if (!tag.name) {
      tag.name = tag_id;
    }

    if (!tag.visibility) {
      tag.visibility = "public";
    }

    res.set(tag_id, tag);
  });

  return res;
}

/// Given a slug, retrieve the `Tag` with that slug.
///
/// Note that this function will throw an error if the tag does not exist. Additionally, this function will load the
/// entire set of tags from the `/contents/tags.yaml` file by way of the `loadTags` function.
export async function getTagWithSlug(slug: string): Promise<Tag> {
  const tags = await loadTags();
  for (let tag of tags.values()) {
    if (tag.slug === slug) {
      return tag;
    }
  }

  return Promise.reject(`Unable to find tag with slug '${slug}'`);
}
