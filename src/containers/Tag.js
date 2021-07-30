import React from "react";
import { useRouteData, Head } from "react-static";
import PostCard from "components/PostCard";

const Tag = () => {
  const { tag_id, posts, authors, tags } = useRouteData();
  const tag = tags[tag_id];

  return (
    <React.Fragment>
      <Head>
        <title>{tag.name}</title>
      </Head>
      <h1>{tag.name}</h1>
      <p>This tag features in {posts.length} posts</p>
      <div className="post-cards">
        {posts.map((post, index) => (
          <PostCard key={post.id} tags={tags} authors={authors} post={post} large={false} />
        ))}
      </div>
    </React.Fragment>
  );
};

export default Tag;
