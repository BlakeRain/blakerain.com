import React, { useEffect, useRef } from "react";
import { createUseStyles } from "react-jss";
import { useRouteData, Head } from "react-static";
import Content from "../components/Content";

const useBlogPostStyles = createUseStyles({
  postComments: {
    margin: [0, "auto", "1.5em", "auto"],
    maxWidth: 840,
  },
});

export default function BlogPost() {
  const classes = useBlogPostStyles();
  const commento = useRef();
  const { authors, tags, post } = useRouteData();

  useEffect(() => {
    const existing = document.querySelector("script#commento-script");
    if (!existing) {
      console.log("Inserting commento.io script");
      const commento_script = document.createElement("SCRIPT");
      commento_script.id = "commento-script";
      commento_script.defer = true;
      commento_script.src = "https://cdn.commento.io/js/commento.js";
      commento.current.parentNode.appendChild(commento_script);
    }
  });

  return (
    <div>
      <Head>
        <title>{post.title}</title>
      </Head>
      <Content authors={authors} tags={tags} content={post} />
      <section className={classes.postComments}>
        <div ref={commento} id="commento"></div>
      </section>
    </div>
  );
}
