import React from "react";
import { Link } from "components/Router";

import "./PostCard.less";

const monthName = (month) => {
  switch (month) {
    case 1: return "January";
    case 2: return "February";
    case 3: return "March";
    case 4: return "April";
    case 5: return "May";
    case 6: return "June";
    case 7: return "July";
    case 8: return "August";
    case 9: return "September";
    case 10: return "October";
    case 11: return "November";
    case 12: return "December";
    default:
      return "???";
  }
};

const DateSpan = ({ date }) => (
  <span>{date.getDate()} {monthName(date.getMonth()).substr(0, 3)} {date.getFullYear()}</span>
);

const AuthorImages = ({ authors }) => (
  <div className="author-images">
    {
      authors.map(author => (
        <img key={author.id} src={author.profile_image} />
      ))
    }
  </div>
);

const PostCard = ({ post, large }) => {
  const published = new Date(post.published_at);

  var tags = Array.prototype.slice.call(post.tags);
  if (post.primary_tag) {
    if (!tags.find(tag => tag.id === post.primary_tag.id)) {
      tags.unshift(post.primary_tag);
    }
  }

  return (
    <article key={post.id} className={"post-card " + (large ? "large" : "")}>
      <Link to={"/blog/" + post.slug}>
        <img src={post.feature_image} alt={post.title} />
      </Link>
      <div className="inner">
        <Link to={"/blog/" + post.slug}>
          <header>{post.title}</header>
          <section>
            {post.custom_excerpt}
          </section>
        </Link>
        <footer>
          <AuthorImages authors={post.authors} />
          <div className="post-card-details">
            <ul>
              {
                post.authors.map(author => (
                  <li key={author.id}>{author.name}</li>
                ))
              }
            </ul>
            <div>
              <DateSpan date={published} />
              <span className="reading-time">
                {post.reading_time} min read
              </span>
            </div>
            <ul>
              {
                tags.map(tag => (
                  <li key={tag.id}>
                    {tag.name}
                  </li>
                ))
              }
            </ul>
          </div>
        </footer>
      </div>
    </article>
  )
};

export default PostCard;