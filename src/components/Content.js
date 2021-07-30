import React, { useEffect, useRef } from "react";
import { useLocation } from "@reach/router";
import Mark from "mark.js";

import { Link } from "./Router";
import PostDetails from "./PostDetails";

import Prism from "prismjs";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-c";
import "prismjs/components/prism-cmake";
import "prismjs/components/prism-cpp";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-nginx";
import "prismjs/components/prism-python";

Prism.languages["box-drawing"] = {};

import "./Content.less";

export default function Content(props) {
  const contentDiv = useRef();
  const location = useLocation();

  useEffect(() => {
    location.search
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
  });

  useEffect(() => {
    contentDiv.current.querySelectorAll("code[class*='language-']").forEach((node) => {
      const lang = node.className.substr(9);
      if (!Prism.languages[lang]) {
        console.warn(`Missing Prism language '${lang}'`);
      } else {
        const html = Prism.highlight(node.innerText, Prism.languages[lang], lang);
        node.innerHTML = html;
      }
    });
  });

  return (
    <article className="post">
      <header className="post-header">
        <h1>{props.content.title}</h1>
        <ul className="bullet-list">
          {props.content.tags
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
        <PostDetails post={props.content} />
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
