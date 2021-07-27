import React from "react";
import { useRouteData } from "react-static";

export default () => {
  const { posts } = useRouteData();

  return (
    <div style={{ textAlign: 'center' }}>
      <h1>Welcome to React-Static</h1>
      <p>There are {posts.length} blog posts</p>
    </div>
  );
};
