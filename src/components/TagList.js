import React from "react";
import { Link } from "@reach/router";

const TagList = ({ tagsDict, tagIds }) => (
  <ul className="bullet-list">
    {tagIds
      .map((tag) => tagsDict[tag])
      .filter((tag) => tag.visibility === "public")
      .map((tag) => (
        <li key={tag.id}>
          <Link to={"/tags/" + tag.slug} title={tag.description}>
            {tag.name}
          </Link>
        </li>
      ))}
  </ul>
);

export default TagList;
