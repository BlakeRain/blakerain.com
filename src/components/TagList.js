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
});

const TagList = ({ tagsDict, tagIds }) => {
  const classes = useTagListStyles();

  return (
    <ul className={classes.root}>
      {tagIds
        .map((tag) => tagsDict[tag])
        .filter((tag) => tag.visibility === "public")
        .map((tag) => (
          <li key={tag.id} className={classes.item}>
            <Link to={"/tags/" + tag.slug} title={tag.description}>
              {tag.name}
            </Link>
          </li>
        ))}
    </ul>
  );
};

export default TagList;
