import React from "react";
import { useLocation } from "@reach/router";
import { useSiteData, Head } from "react-static";

const TwitterCard = (props) => {
  const location = useLocation();
  const siteData = useSiteData();
  const title = props.title || siteData.title;

  var written_by = null;
  if (props.written_by) {
    written_by = (
      <React.Fragment>
        <meta property="twitter:label1" content="Written by" />
        <meta property="twitter:data1" content={props.written_by.name} />
        <meta property="twitter:creator" content={"@" + props.written_by.twitter} />
      </React.Fragment>
    );
  }

  var description = null;
  if (props.description) {
    description = <meta property="twitter:description" content={props.description} />;
  }

  return (
    <Head>
      <meta property="twitter:card" content={props.card} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:site" content={siteData.twitter} />
      {description}
      {written_by}
      <meta property="twitter:url" content={"https://blakerain.com" + location.pathname} />
    </Head>
  );
};

export default TwitterCard;
