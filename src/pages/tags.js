import { Link } from "@reach/router";
import React from "react";
import { useRouteData } from "react-static";

const Tags = (props) => {
  const { tags } = useRouteData();
  return (
    <div>
      <h1>Le Tags ({tags.length} many tags)</h1>
      <ul>
        {tags.map((tag) => (
          <li key={tag.id}>
            <Link to={"/tags/" + tag.slug}>{tag.name}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Tags;
