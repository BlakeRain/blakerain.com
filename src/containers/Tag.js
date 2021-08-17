import React from "react";
import { Link } from "@reach/router";
import { useRouteData, Head } from "react-static";
import { PostCards } from "components/PostCard";

const Tag = () => {
  const { tag_id, posts, authors, tags } = useRouteData();
  const tag = tags[tag_id];

  return (
    <React.Fragment>
      <Head>
        <title>{tag.name} Tag</title>
      </Head>
      <h1>
        <Link to={"/tags"}>Tags</Link> / {tag.name}
        <small>
          There are {posts.length} post{posts.length === 1 ? "" : "s"} with this tag
        </small>
      </h1>
      <PostCards tags={tags} authors={authors} posts={posts} large={false} />
    </React.Fragment>
  );
};

export default Tag;
