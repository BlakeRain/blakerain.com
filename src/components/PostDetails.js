import React from "react";
import { useSiteData } from "react-static";
import DateSpan from "./DateSpan";

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
        <div className="post-date-and-time">
          <DateSpan date={published} />
          <span className="reading-time">{post.reading_time} min read</span>
        </div>
        {props.children}
      </div>
    </div>
  );
};

export default PostDetails;
