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

export type Tags = { [id: string]: Tag };

export async function loadTags(): Promise<Tags> {
  const tagsPath = path.join(process.cwd(), "content", "tags.yaml");
  const tagsSrc = await fs.readFile(tagsPath, "utf-8");
  const tags = yaml.parse(tagsSrc) as Tags;

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
  });

  return tags;
}

export async function getTagWithSlug(slug: string): Promise<Tag> {
  const tags = await loadTags();
  for (let tag_id in tags) {
    if (tags[tag_id].slug === slug) {
      return tags[tag_id];
    }
  }

  return Promise.reject(`Unable to find tag with slug '${slug}'`);
}
