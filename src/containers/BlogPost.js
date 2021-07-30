import React from "react";
import { useRouteData, Head } from "react-static";
import Content from "../components/Content";

export default function BlogPost() {
  const { post } = useRouteData();

  return (
    <div>
      <Head>
        <title>{post.title}</title>
      </Head>
      <Content content={post} />
    </div>
  );
}
