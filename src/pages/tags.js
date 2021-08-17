import React from "react";
import { Link } from "@reach/router";
import { useRouteData, Head } from "react-static";
import { createUseStyles } from "react-jss";
import DateSpan from "components/DateSpan";
import { PrimaryBackground } from "../components/Styles";

const useTagPostStyles = createUseStyles({
  item: {
    display: "block",
  },
  postDateAndTime: {
    fontSize: "80%",
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
});

const TagPost = ({ post }) => {
  const classes = useTagPostStyles();

  return (
    <li className={classes.item}>
      <Link to={"/blog/" + post.slug}>{post.title}</Link>
      <div className={classes.postDateAndTime}>
        <DateSpan date={new Date(post.published_at)} />
        <span className={classes.readingTime}>{post.reading_time} min read</span>
      </div>
    </li>
  );
};

const useTagStyles = createUseStyles({
  article: {
    display: "flex",
    flexDirection: "column",

    border: "1px solid " + PrimaryBackground.string(),
    borderRadius: "1rem",
    padding: "1rem",
  },
  header: {
    minHeight: "12rem",
  },
  title: {
    margin: 0,
  },
  subtitle: {
    display: "inline-block",
    margin: [0, 0, 0, "0.5rem"],
  },
  description: {
    marginTop: "0.5rem",
  },
  postList: {
    padding: 0,
    listStyle: "none",
    margin: [0, 0, 0, "2rem"],
  },
});

const Tag = ({ tag }) => {
  const classes = useTagStyles();

  return (
    <article className={classes.article}>
      <header className={classes.header}>
        <h1 className={classes.title}>
          <Link to={"/tags/" + tag.slug}>{tag.name}</Link>
          <small className={classes.subtitle}>({tag.posts.length})</small>
        </h1>
        <p className={classes.description}>{tag.description}</p>
      </header>
      <footer>
        <small>
          Assigned to {tag.posts.length} post{tag.posts.length === 1 ? "" : "s"}:
        </small>
        <ul className={classes.postList}>
          {tag.posts.map((post) => (
            <TagPost key={post.id} post={post} />
          ))}
        </ul>
      </footer>
    </article>
  );
};

const useTagsStyles = createUseStyles({
  list: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(500px, 1fr))",
    columnGap: "2rem",
    rowGap: "2rem",
    margin: [[40, 0]],
  },
});

const Tags = (props) => {
  const classes = useTagsStyles();
  const { tags } = useRouteData();

  return (
    <div>
      <Head>
        <title>Tags</title>
      </Head>
      <h1>There are {tags.length} tags on this site</h1>
      <div className={classes.list}>
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
