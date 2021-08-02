import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "@reach/router";

import { Link } from "./Router";
import PostDetails from "./PostDetails";

Prism.languages["box-drawing"] = {};

const HighlightControls = (props) => {
  function jumpTo(index) {
    if (index >= 0 && index < props.results.length && index !== props.current) {
      if (props.current !== -1) {
        props.results[props.current].className = "";
      }

      props.results[index].className = "current";
      props.setCurrent(index);
      window.scrollTo(0, props.results[index].offsetTop);
    }
  }

  function onNextClick() {
    if (props.current === props.results.length - 1) {
      jumpTo(0);
    } else {
      jumpTo(Math.min(props.current + 1, props.results.length - 1));
    }
  }

  function onPrevClick() {
    if (props.current === -1 || props.current === 0) {
      jumpTo(props.results.length - 1);
    } else {
      jumpTo(Math.max(0, props.current - 1));
    }
  }

  function onClearClick() {
    props.onClear();
  }

  if (props.results.length === 0) {
    return null;
  }

  return (
    <div className="highlight-controls">
      <button type="button" onClick={onNextClick}>
        &darr; Next
      </button>
      <button type="button" onClick={onPrevClick}>
        &uarr; Previous
      </button>
      <button type="button" onClick={onClearClick}>
        Clear
      </button>
      <span>
        {props.current === -1 ? "0" : (props.current + 1).toString()} /{" "}
        {props.results.length.toString()} result{props.results.length === 1 ? "" : "s"}
      </span>
    </div>
  );
};

export default function Content(props) {
  const contentDiv = useRef();
  const [results, setResults] = useState([]);
  const [current, setCurrent] = useState(-1);

  function onClearHighlight() {
    setResults([]);
    setCurrent(-1);

    if (window["_mark"]) {
      window["_mark"].unmark();
    }
  }

  function getHighlightTerm() {
    const terms = window.location.search
      .substr(1)
      .split("&")
      .map((term) => term.split("="))
      .filter((term_pair) => term_pair.length == 2 && term_pair[0] === "highlight");
    if (terms.length > 0) {
      return terms.map((term) => decodeURIComponent(term[1])).join(" ");
    } else {
      return null;
    }
  }

  function prepareHighlight() {
    const term = getHighlightTerm();
    if (term) {
      const instance = new Mark(contentDiv.current);
      instance.mark(term, {
        separateWordSearch: true,
        done: () => {
          if (contentDiv.current) {
            setResults(Array.prototype.slice.call(contentDiv.current.querySelectorAll("mark")));
          }
        },
      });

      window["_mark"] = instance;
    }
  }

  useEffect(() => {
    if (typeof document !== "undefined") {
      contentDiv.current.querySelectorAll('code[class*="language-"').forEach((element) => {
        Prism.highlightElement(element, false, () => {
          console.log("Syntax highlighting done for", element);
        });
      });

      window.setTimeout(() => {
        prepareHighlight();
      }, 100);
    }
  }, [false]);

  return (
    <article className="post">
      <HighlightControls
        current={current}
        setCurrent={setCurrent}
        results={results}
        onClear={onClearHighlight}
      />
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
