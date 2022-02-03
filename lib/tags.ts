import { promises as fs } from "fs";
import path from "path";
import yaml from "yaml";

export type TagId = string;

export interface Tag {
  slug: TagId;
  name: string;
  visibility?: "public" | "private";
  description?: string;
}

export type Tags = Map<string, Tag>;

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

export async function getTagWithSlug(slug: string): Promise<Tag> {
  const tags = await loadTags();
  for (let tag of tags.values()) {
    if (tag.slug === slug) {
      return tag;
    }
  }

  return Promise.reject(`Unable to find tag with slug '${slug}'`);
}
