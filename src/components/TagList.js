import React from "react";
import { Link } from "@reach/router";
import { createUseStyles } from "react-jss";

const useTagListStyles = createUseStyles({
  root: {
    listStyle: "none",
    margin: 0,
    padding: 0,
    display: "flex",
    flexDirection: "row",

    textTransform: "uppercase",
    fontSize: "1.2rem",
    lineHeight: "1.4em",
    fontWeigh: 400,
  },
  large: {
    fontSize: "1.3rem",
    lineHeight: "1.6em",
    fontWeight: 600,
  },
  item: {
    position: "relative",
    display: "block",
    marginLeft: 10,
    fontWeight: 600,

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
  largeItem: {
    marginLeft: 20,

    "&:before": {
      top: 8,
      left: -12,
      width: 4,
      height: 4,
    },
  },
});

const TagList = ({ tagsDict, tagIds, large }) => {
  const classes = useTagListStyles();
  const itemClassName = classes.item + (large ? " " + classes.largeItem : "");

  return (
    <ul className={classes.root + (large ? " " + classes.large : "")}>
      {tagIds
        .map((tag) => tagsDict[tag])
        .filter((tag) => tag.visibility === "public")
        .map((tag) => (
          <li key={tag.id} className={itemClassName}>
            <Link to={"/tags/" + tag.slug} title={tag.description}>
              {tag.name}
            </Link>
          </li>
        ))}
    </ul>
  );
};

export default TagList;
