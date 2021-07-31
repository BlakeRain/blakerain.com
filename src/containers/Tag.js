import React from "react";
import { useRouteData, Head } from "react-static";
import PostCard from "components/PostCard";

const Tag = () => {
  const { tag_id, posts, authors, tags } = useRouteData();
  const tag = tags[tag_id];

  return (
    <React.Fragment>
      <Head>
        <title>{tag.name} Tag</title>
      </Head>
      <h1>
        {tag.name}
        <small>
          There are {posts.length} post{posts.length === 1 ? "" : "s"} with this tag
        </small>
      </h1>
      <div className="post-cards">
        {posts.map((post, index) => (
          <PostCard key={post.id} tags={tags} authors={authors} post={post} large={false} />
        ))}
      </div>
    </React.Fragment>
  );
};

export default Tag;
