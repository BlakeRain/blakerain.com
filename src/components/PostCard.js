import React from "react";
import { Link } from "components/Router";
import PostDetails from "./PostDetails";

import "./PostCard.less";

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
          <ul className="bullet-list">
            {post.tags
              .map((tag_id) => tags[tag_id])
              .filter((tag) => tag.visibility == "public")
              .map((tag) => (
                <li key={tag.id}>
                  <Link to={"/tags/" + tag.slug}>{tag.name}</Link>
                </li>
              ))}
          </ul>
        </PostDetails>
      </div>
    </article>
  );
};

export default PostCard;
