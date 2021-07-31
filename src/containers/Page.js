import React from "react";
import { useRouteData, Head } from "react-static";
import Content from "../components/Content";

export default function Page() {
  const { authors, tags, page } = useRouteData();

  return (
    <React.Fragment>
      <Head>
        <title>{page.title}</title>
      </Head>
      <Content authors={authors} tags={tags} content={page} />
    </React.Fragment>
  );
}
