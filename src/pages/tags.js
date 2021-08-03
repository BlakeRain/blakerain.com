import React from "react";
import { Link } from "@reach/router";
import { useRouteData, Head } from "react-static";
import DateSpan from "components/DateSpan";

const TagPost = ({ post }) => {
  return (
    <li>
      <Link to={"/blog/" + post.slug}>{post.title}</Link>
      <div className="post-date-and-time">
        <DateSpan date={new Date(post.published_at)} />
        <span className="reading-time">{post.reading_time} min read</span>
      </div>
    </li>
  );
};

const Tag = ({ tag }) => {
  return (
    <article>
      <header>
        <h1>
          <Link to={"/tags/" + tag.slug}>{tag.name}</Link>
          <small>({tag.posts.length})</small>
        </h1>
        <p>{tag.description}</p>
      </header>
      <footer>
        <small>
          Assigned to {tag.posts.length} post{tag.posts.length === 1 ? "" : "s"}:
        </small>
        <ul>
          {tag.posts.map((post) => (
            <TagPost key={post.id} post={post} />
          ))}
        </ul>
      </footer>
    </article>
  );
};

const Tags = (props) => {
  const { tags } = useRouteData();
  return (
    <div>
      <Head>
        <title>Tags</title>
      </Head>
      <h1>There are {tags.length} tags on this site</h1>
      <div className="tags-list">
        {tags
          .sort((a, b) => b.posts.length - a.posts.length)
          .map((tag) => (
            <Tag key={tag.id} tag={tag} />
          ))}
      </div>
    </div>
  );
};

export default Tags;
