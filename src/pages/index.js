import React from "react";
import { useRouteData, Head } from "react-static";
import { PostCards } from "components/PostCard";
import TwitterCard from "../components/metadata/Twitter";

export default () => {
  const { authors, tags, posts } = useRouteData();

  return (
    <React.Fragment>
      <Head>
        <title>Blake Rain</title>
      </Head>
      <TwitterCard card="summary" />
      <PostCards authors={authors} tags={tags} posts={posts} />
    </React.Fragment>
  );
};
