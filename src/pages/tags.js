import { Link } from "@reach/router";
import React from "react";
import { useRouteData, Head } from "react-static";

const Tags = (props) => {
  const { tags } = useRouteData();
  return (
    <div>
      <Head>
        <title>Post Tags</title>
      </Head>
      <h1>There are {tags.length} tags on this site:</h1>
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
