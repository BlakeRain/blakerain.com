import React from "react";
import { Link } from "components/Router";
import PostDetails from "./PostDetails";
import TagList from "./TagList";

const PostCard = ({ post, large, tags, authors }) => {
  return (
    <article key={post.id} className={"post-card " + (large ? "large" : "")}>
      <Link to={"/blog/" + post.slug}>
        <img className="post-card-image" src={post.feature_image} alt={post.title} />
      </Link>
      <div className="inner">
        <Link to={"/blog/" + post.slug}>
          <header>{post.title}</header>
          <section>{post.custom_excerpt}</section>
        </Link>
        <PostDetails post={post} authors={authors}>
          <TagList tagsDict={tags} tagIds={post.tags} />
        </PostDetails>
      </div>
    </article>
  );
};

export default PostCard;
