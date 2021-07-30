import React from "react";
import { useRouteData, Head } from "react-static";
import PostCard from "components/PostCard";
import TwitterCard from "../components/metadata/Twitter";

export default function Blog() {
  const { authors, tags, posts } = useRouteData();

  return (
    <div className="post-cards">
      <Head>
        <title>Blog</title>
      </Head>
      <TwitterCard card="summary" />
      {posts.map((post, index) => (
        <PostCard key={post.id} tags={tags} authors={authors} post={post} large={index === 0} />
      ))}
    </div>
  );
}
