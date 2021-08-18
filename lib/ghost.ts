import GhostContentAPI, { Author, PostOrPage, Tag, TagVisibility } from "@tryghost/content-api";
import React from "react";

export function getContentAPI() {
  const key = process.env.GHOST_CONTENT_API_KEY;
  if (typeof key === "undefined") {
    throw new Error("Expected environment variable 'GHOST_CONTENT_API_KEY'");
  }

  return new GhostContentAPI({
    url: process.env.GHOST_HOSTNAME || "localhost",
    key: key,
    version: "v3",
  });
}

export type AuthorId = string;

export interface SimpleAuthor {
  id: AuthorId;
  name: string;
  slug: string;
  profileImage: string | null;
}

export type AuthorDictionary = { [authorId: string]: SimpleAuthor };

export type TagId = string;

export interface SimpleTag {
  id: TagId;
  name: string;
  slug: string;
  description: string | null;
  visibility: TagVisibility;
}

export type TagDictionary = { [tagId: string]: SimpleTag };

export interface ListPost {
  id: string;
  slug: string;
  title: string;
  featureImage: string | null;
  customExcerpt: string | null;
  tags: TagId[];
  authors: AuthorId[];
  readingTime: number;
  publishedAt: string | null;
}

export interface DisplayPost extends ListPost {
  html: string;
}

function simplifyAuthor(author: Author): SimpleAuthor {
  return {
    id: author.id,
    name: author.name || "<un-named>",
    slug: author.slug,
    profileImage: author.profile_image || null,
  };
}

function buildAuthorDictionary(authors: Author[]): AuthorDictionary {
  return authors.reduce((dict, author) => {
    dict[author.id] = simplifyAuthor(author);
    return dict;
  }, {} as AuthorDictionary);
}

function simplifyTag(tag: Tag): SimpleTag {
  return {
    id: tag.id,
    name: tag.name || "<un-named>",
    slug: tag.slug,
    description: tag.description || null,
    visibility: tag.visibility || "internal",
  };
}

function buildTagDictionary(tags: Tag[]): TagDictionary {
  return tags.reduce((dict, tag) => {
    dict[tag.id] = simplifyTag(tag);
    return dict;
  }, {} as TagDictionary);
}

function buildListPost(post: PostOrPage): ListPost {
  return {
    id: post.id,
    slug: post.slug,
    title: post.title || "Untitled",
    featureImage: post.feature_image || null,
    customExcerpt: post.custom_excerpt || null,
    tags: post.tags?.map((tag) => tag.id) || [],
    authors: post.authors?.map((author) => author.id) || [],
    readingTime: post.reading_time || 0,
    publishedAt: post.published_at || null,
  };
}

function buildDisplayPost(post: PostOrPage): DisplayPost {
  var obj = buildListPost(post) as DisplayPost;
  obj.html = post.html || "<b>No Content</b>";
  return obj;
}

export interface SiteNavigation {
  label: string;
  url: string;
}

export interface SiteSettings {
  title: string;
  navigation: SiteNavigation[];
}

export const SiteSettingsContext = React.createContext<SiteSettings | null>(null);

export async function getSiteSettings(): Promise<SiteSettings> {
  const { title, navigation } = await getContentAPI().settings.browse({ limit: "all" });
  return {
    title: title || "No Title",
    navigation: navigation?.map((value) => ({ label: value.label, url: value.url })) || [],
  };
}

export async function getAllPostSlugs(): Promise<string[]> {
  const posts = await getContentAPI().posts.browse({ limit: "all", fields: ["slug"] });
  return posts.map((post) => post.slug);
}

export async function getAllListPosts(): Promise<ListPost[]> {
  const posts = await getContentAPI().posts.browse({
    limit: "all",
    include: ["authors", "tags"],
  });
  return posts.map((post) => buildListPost(post));
}

export async function getAllTags(): Promise<TagDictionary> {
  const tags = await getContentAPI().tags.browse();
  return buildTagDictionary(tags);
}

export async function getAllAuthors(): Promise<AuthorDictionary> {
  const authors = await getContentAPI().authors.browse();
  return buildAuthorDictionary(authors);
}

export interface PostInformation {
  post: DisplayPost;
  tags: TagDictionary;
  authors: AuthorDictionary;
}

export async function getPostWithSlug(slug: string): Promise<PostInformation> {
  const post = await getContentAPI().posts.read(
    { slug: slug },
    { include: ["authors", "tags"] }
  );
  return {
    post: buildDisplayPost(post),
    tags: buildTagDictionary(post.tags || []),
    authors: buildAuthorDictionary(post.authors || []),
  };
}
