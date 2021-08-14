import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "@reach/router";

import { Link } from "./Router";
import PostDetails from "./PostDetails";
import { ScrollToTopButton } from "./ScrollToTop";

const HighlightControls = (props) => {
  function jumpTo(index) {
    index = index % props.results.length;
    if (index < props.results.length) {
      if (props.current !== -1) {
        props.results[props.current].className = "";
      }

      props.setCurrent(index);
      props.results[index].className = "current";
      window.scrollTo(0, props.results[index].offsetTop);
    }
  }

  function onNextClick() {
    jumpTo(props.current + 1);
  }

  function onPrevClick() {
    if (props.current === 0) {
      jumpTo(props.results.length - 1);
    } else {
      jumpTo(props.current - 1);
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
  const syntaxHighlighted = useRef(false);
  const mark = useRef(null);
  const lastTerm = useRef("");
  const location = useLocation();
  const [results, setResults] = useState([]);
  const [current, setCurrent] = useState(-1);

  const getHighlightTerm = () => {
    const terms = location.search
      .substr(1)
      .split("&")
      .map((term) => term.split("="))
      .filter((term_pair) => term_pair.length == 2 && term_pair[0] === "highlight");
    if (terms.length > 0) {
      return terms.map((term) => decodeURIComponent(term[1])).join(" ");
    } else {
      return null;
    }
  };

  const getMarkInstance = () => {
    if (mark.current) {
      return mark.current;
    } else {
      return (mark.current = new Mark(contentDiv.current));
    }
  };

  const onClearHighlight = () => {
    setResults([]);
    setCurrent(-1);

    if (mark.current) {
      mark.current.unmark();
    }
  };

  function prepareHighlight() {
    const term = getHighlightTerm();
    if (term && term != lastTerm.current) {
      console.log(`Preparing highlight of term: '${term}'`);
      lastTerm.current = term;
      const highlight_start = performance.now();
      const instance = getMarkInstance();

      instance.unmark();

      instance.mark(term, {
        separateWordSearch: true,
        done: () => {
          if (contentDiv.current) {
            const new_results = Array.prototype.slice.call(
              contentDiv.current.querySelectorAll("mark")
            );

            setResults(new_results);

            if (new_results.length > 0) {
              setCurrent(0);
              window.scrollTo(0, new_results[0].offsetTop);
              new_results[0].className = "current";
            } else {
              setCurrent(-1);
            }

            console.log(
              `Completed highlighting of ${new_results.length} match(es) in ${(
                performance.now() - highlight_start
              ).toFixed(2)} ms`
            );
          }
        },
      });
    }
  }

  const syntaxHighlight = () => {
    if (!syntaxHighlighted.current) {
      var highlight_count = 0;
      const highlight_start = performance.now();

      contentDiv.current.querySelectorAll('code[class*="language-"').forEach((element) => {
        Prism.highlightElement(element, false, () => {
          ++highlight_count;
        });
      });

      if (highlight_count > 0) {
        console.log(
          `Completed syntax highlighting of ${highlight_count} element(s) in ${(
            performance.now() - highlight_start
          ).toFixed(2)} ms`
        );
      }

      syntaxHighlighted.current = true;
    }
  };

  useEffect(() => {
    if (typeof document !== "undefined") {
      syntaxHighlight();

      window.setTimeout(() => {
        prepareHighlight();
      }, 100);
    }
  });

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
      <ScrollToTopButton className={results.length > 0 ? "skip-highlight-controls" : ""} />
    </article>
  );
}
