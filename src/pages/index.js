import React from "react";
import { useRouteData } from "react-static";
import PostCard from "components/PostCard";
import TwitterCard from "../components/metadata/Twitter";

export default () => {
  const { authors, tags, posts } = useRouteData();

  return (
    <div className="post-cards">
      <TwitterCard card="summary" />
      {posts.map((post, index) => (
        <PostCard key={post.id} tags={tags} authors={authors} post={post} large={index === 0} />
      ))}
    </div>
  );
};
