import React from "react";
import { useSiteData } from "react-static";
import DateSpan from "./DateSpan";
import { createUseStyles } from "react-jss";
import { ColorDarkGrey, ColorLightGrey } from "./Styles";

const buildImageURL = (image_url) => {
  const { url } = useSiteData();
  if (image_url.startsWith(url)) {
    return "https://static.blakerain.com/media/" + image_url.substr(url.length);
  } else {
    return image_url;
  }
};

const useAuthorImagesStyles = createUseStyles({
  image: {
    width: 34,
    height: 34,
    borderRadius: "100%",
  },
});

const AuthorImages = ({ authors }) => {
  const classes = useAuthorImagesStyles();

  return (
    <div>
      {authors.map((author) => (
        <img
          key={author.id}
          className={classes.image}
          src={buildImageURL(author.profile_image)}
        />
      ))}
    </div>
  );
};

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

const usePostDetailsStyles = createUseStyles({
  root: {
    display: "flex",
    flexDirection: "row",
  },
  details: {
    marginLeft: 6,
    textTransform: "uppercase",
    fontSize: "1.2rem",
    lineHeight: "1.4em",
    fontWeigh: 400,
    color: ColorDarkGrey.string(),

    "@media (prefers-color-scheme: dark)": {
      color: ColorLightGrey.string(),
    },
  },
  dateAndTime: {
    display: "flex",
    flexDirection: "row",
  },
  readingTime: {
    marginLeft: 20,
    position: "relative",

    "&:before": {
      content: '""',
      position: "absolute",
      top: 7,
      left: -11,
      display: "block",
      width: 2,
      height: 2,
      backgroundColor: "rgba(255, 255, 255, 0.5)",
      borderRadius: "100%",
    },
  },
  authorList: {
    listStyle: "none",
    margin: 0,
    padding: 0,
    display: "flex",
    flexDirection: "row",
  },
  authorListItem: {
    position: "relative",
    display: "block",
    marginLeft: 10,
    fontWeight: 600,
    fontSize: "1.3rem",

    "&:first-of-type": {
      marginLeft: 0,

      "&:before": {
        display: "none",
      },
    },

    "&:before": {
      content: '""',
      display: "block",
      position: "absolute",
      top: 7,
      left: -6,
      width: 2,
      height: 2,
      backgroundColor: "rgba(255, 255, 255, 0.5)",
      borderRadius: "100%",
    },
  },
});

const PostDetails = (props) => {
  const post = props.post;
  const classes = usePostDetailsStyles();
  const authors = decodeAuthors(props.authors, post);
  const published = new Date(post.published_at);

  return (
    <div className={classes.root + " " + props.className}>
      <AuthorImages authors={authors} />
      <div className={classes.details}>
        <ul className={classes.authorList}>
          {authors.map((author) => (
            <li key={author.id} className={classes.authorListItem}>
              {author.name}
            </li>
          ))}
        </ul>
        <div className={classes.dateAndTime}>
          <DateSpan date={published} />
          <span className={classes.readingTime}>{post.reading_time} min read</span>
        </div>
        {props.children}
      </div>
    </div>
  );
};

export default PostDetails;
