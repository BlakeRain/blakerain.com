import React, { useEffect, useRef } from "react";
import { useRouteData, Head } from "react-static";
import Content from "../components/Content";

export default function BlogPost() {
  const commento = useRef();
  const { authors, tags, post } = useRouteData();

  useEffect(() => {
    const commento_script = document.createElement("SCRIPT");
    commento_script.defer = true;
    commento_script.src = "https://cdn.commento.io/js/commento.js";
    commento.current.parentNode.appendChild(commento_script);
  });

  return (
    <div>
      <Head>
        <title>{post.title}</title>
      </Head>
      <Content authors={authors} tags={tags} content={post} />
      <section className="post-comments">
        <div ref={commento} id="commento"></div>
      </section>
    </div>
  );
}
