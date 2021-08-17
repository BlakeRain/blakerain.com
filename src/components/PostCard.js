import React from "react";
import { Link } from "@reach/router";
import PostDetails from "./PostDetails";
import TagList from "./TagList";
import { createUseStyles } from "react-jss";
import { ColorMidGrey, TextFontFamily } from "./Styles";

const postCardStyles = createUseStyles({
  article: {
    display: "flex",
    flexDirection: "column",
    flex: [1, 1, "300px"],
    minHeight: 220,
    margin: [0, 0, 40, 0],
    padding: [0, 20, 40, 20],
  },
  largeArticle: {
    "@media (min-width: 795px)": {
      flex: [1, 1, "100%"],
      flexDirection: "row",
      minHeight: 280,
    },
  },
  image: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    objectFit: "cover",
  },
  largeImage: {
    "@media (min-width: 795px)": {
      width: "100%",
      height: "100%",
      maxHeight: 240,
    },
  },
  inner: {
    flexGrow: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  largeInner: {
    "@media (min-width: 795px)": {
      width: "100%",
      marginLeft: 40,
      justifyContent: "start",
    },
  },
  link: {
    display: "block",
    marginBottom: "1em",
  },
  title: {
    fontSize: "2.2rem",
    fontWeight: 600,
    lineHeight: "1.15em",
    color: "rgba(0, 0, 0, 0.85)",
    marginTop: 15,
    marginBottom: 10,

    "@media (prefers-color-scheme: dark)": {
      color: "rgba(255, 255, 255, 0.85)",
    },
  },
  excerpt: {
    color: ColorMidGrey.string(),
    fontFamily: TextFontFamily,
    fontSize: "2rem",
    lineHeight: "1.6em",

    "@media (prefers-color-scheme: dark)": {
      color: ColorMidGrey.lighten(0.5).string(),
    },
  },
});

export const PostCard = ({ post, large, tags, authors }) => {
  const classes = postCardStyles();

  return (
    <article
      key={post.id}
      className={classes.article + " " + (large ? classes.largeArticle : "")}>
      <Link to={"/blog/" + post.slug}>
        <img
          className={classes.image + " " + (large ? classes.largeImage : "")}
          src={post.feature_image}
          alt={post.title}
        />
      </Link>
      <div className={classes.inner + " " + (large ? classes.largeInner : "")}>
        <Link to={"/blog/" + post.slug} className={classes.link}>
          <header className={classes.title}>{post.title}</header>
          <section className={classes.excerpt}>{post.custom_excerpt}</section>
        </Link>
        <PostDetails post={post} authors={authors}>
          <TagList tagsDict={tags} tagIds={post.tags} />
        </PostDetails>
      </div>
    </article>
  );
};

const usePostCardsStyles = createUseStyles({
  cards: {
    display: "flex",
    flexWrap: "wrap",
    marginTop: 40,
  },
});

export const PostCards = ({ authors, tags, posts }) => {
  const classes = usePostCardsStyles();

  return (
    <div className={classes.cards}>
      {posts.map((post, index) => (
        <PostCard key={post.id} tags={tags} authors={authors} post={post} large={index === 0} />
      ))}
    </div>
  );
};
