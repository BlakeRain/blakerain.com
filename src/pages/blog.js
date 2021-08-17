import React from "react";
import { useRouteData, Head } from "react-static";
import { PostCards } from "components/PostCard";
import TwitterCard from "components/metadata/Twitter";

export default function Blog() {
  const { authors, tags, posts } = useRouteData();

  return (
    <React.Fragment>
      <Head>
        <title>Blog</title>
      </Head>
      <TwitterCard card="summary" />
      <PostCards authors={authors} tags={tags} posts={posts} />
    </React.Fragment>
  );
}
