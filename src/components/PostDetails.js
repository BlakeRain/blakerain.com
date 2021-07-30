import React from "react";
import { useSiteData } from "react-static";

import "./PostDetails.less";

const monthName = (month) => {
  switch (month) {
    case 0:
      return "January";
    case 1:
      return "February";
    case 2:
      return "March";
    case 3:
      return "April";
    case 4:
      return "May";
    case 5:
      return "June";
    case 6:
      return "July";
    case 7:
      return "August";
    case 8:
      return "September";
    case 9:
      return "October";
    case 10:
      return "November";
    case 11:
      return "December";
    default:
      return "???";
  }
};

const DateSpan = ({ date }) => (
  <span>
    {date.getDate()} {monthName(date.getMonth()).substr(0, 3)} {date.getFullYear()}
  </span>
);

const buildImageURL = (image_url) => {
  const { url } = useSiteData();
  if (image_url.startsWith(url)) {
    return "https://static.blakerain.com/media/" + image_url.substr(url.length);
  } else {
    return image_url;
  }
};

const AuthorImages = ({ authors }) => (
  <div className="author-images">
    {authors.map((author) => (
      <img key={author.id} src={buildImageURL(author.profile_image)} />
    ))}
  </div>
);

const decodeAuthors = (authors, post) => {
  if (
    post.authors instanceof Array &&
    post.authors.length > 0 &&
    typeof post.authors[0] === "string"
  ) {
    return post.authors.map((author_id) => authors[author_id]);
  } else {
    return post.authors;
  }
};

const PostDetails = (props) => {
  const post = props.post;
  const authors = decodeAuthors(props.authors, post);
  const published = new Date(post.published_at);

  return (
    <div className="post-details">
      <AuthorImages authors={authors} />
      <div className="post-card-details">
        <ul className="bullet-list">
          {authors.map((author) => (
            <li key={author.id}>{author.name}</li>
          ))}
        </ul>
        <div className="date-and-time">
          <DateSpan date={published} />
          <span className="reading-time">{post.reading_time} min read</span>
        </div>
        {props.children}
      </div>
    </div>
  );
};

export default PostDetails;
