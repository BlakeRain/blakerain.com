import React from "react"
import { useRouteData } from "react-static"
import PostCard from "components/PostCard"
import TwitterCard from "../components/metadata/Twitter";

export default function Blog() {
  const { posts } = useRouteData();

  return (
    <div className="post-cards">
      <TwitterCard card="summary" />
      {
        posts.map((post, index) => <PostCard key={post.id} post={post} large={index === 0} />)
      }
    </div>
  );
}
