import React, { useEffect, useRef } from "react";
import { useLocation } from "@reach/router";

import { Link } from "./Router";
import PostDetails from "./PostDetails";

Prism.languages["box-drawing"] = {};

export default function Content(props) {
  const contentDiv = useRef();

  useEffect(() => {
    if (typeof document !== "undefined") {
      window.location.search
        .substr(1)
        .split("&")
        .map((term) => term.split("="))
        .forEach((term_pair) => {
          if (term_pair.length > 1 && term_pair[0] == "highlight") {
            const instance = new Mark(contentDiv.current);
            instance.mark(
              decodeURIComponent(term_pair[1], {
                separateWordSearch: true,
                diacritics: true,
              })
            );
          }
        });

      Prism.highlightAllUnder(document.querySelector("div.post-content"));
    }
  }, [false]);

  return (
    <article className="post">
      <header className="post-header">
        <h1>{props.content.title}</h1>
        <ul className="bullet-list">
          {props.content.tags
            .map((tag) => props.tags[tag])
            .filter((tag) => tag.visibility == "public")
            .map((tag) => (
              <li key={tag.id}>
                <Link to={"/tags/" + tag.slug} title={tag.description}>
                  {tag.name}
                </Link>
              </li>
            ))}
        </ul>
        {props.content.custom_excerpt ? <p>{props.content.custom_excerpt}</p> : null}
        <PostDetails authors={props.authors} post={props.content} />
      </header>
      <div className="post-content">
        <div
          ref={contentDiv}
          className="inner"
          dangerouslySetInnerHTML={{ __html: props.content.html }}></div>
      </div>
    </article>
  );
}
