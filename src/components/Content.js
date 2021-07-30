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

    const graphs = Array.prototype.slice.call(
      contentDiv.current.querySelectorAll("script[type='text/dot']")
    );

    if (graphs.length > 0) {
      const d3 = require("d3");
      require("d3-graphviz");

      graphs.forEach((script, index) => {
        const div = document.createElement("DIV");
        div.innerHTML = "<i>Loading ...</i>";
        script.parentNode.insertBefore(div, script);

        d3.select(div)
          .graphviz({})
          .zoom(false)
          .attributer((d) => {
            if (d.attributes && d.parent && "class" in d.parent.attributes) {
              const parent_class = d.parent.attributes["class"];

              if (parent_class == "graph") {
                if (d.tag == "polygon" && d.attributes["fill"] == "white") {
                  d.attributes["fill"] = "transparent";
                }
              } else if (parent_class == "cluster") {
                if (d.tag == "polygon" && d.attributes["stroke"] == "black") {
                  delete d.attributes["stroke"];
                }
              } else if (parent_class == "node") {
                if (d.tag == "text" && d.attributes["fill"] == "white") {
                  delete d.attributes["fill"];
                } else if (d.tag == "ellipse" && d.attributes["stroke"] == "black") {
                  delete d.attributes["stroke"];
                }
              } else if (parent_class == "edge") {
                if (d.tag == "polygon" && d.attributes["fill"] == "black") {
                  delete d.attributes["fill"];
                  delete d.attributes["stroke"];
                } else if (d.tag == "path" && d.attributes["stroke"] == "black") {
                  delete d.attributes["stroke"];
                }
              }
            }
          })
          .renderDot(script.innerText, () => {
            div.firstChild.remove();
          });
      });
    }
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
