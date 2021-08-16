import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "@reach/router";

import { Link } from "./Router";
import PostDetails from "./PostDetails";
import { ScrollToTopButton } from "./ScrollToTop";

const SyntaxHighlighter = (props) => {
  const contentRef = useRef();

  useEffect(() => {
    var highlight_count = 0;
    const highlight_start = performance.now();

    contentRef.current.querySelectorAll('code[class*="language-"]').forEach((element) => {
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
  });

  return <div ref={contentRef}>{props.children}</div>;
};

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

const SearchHighlighter = ({ term, children }) => {
  const location = useLocation();
  const contentRef = useRef();
  const mark = useRef(null);
  const [results, setResults] = useState([]);
  const [current, setCurrent] = useState(-1);

  const getMarkInstance = () => {
    if (mark.current) {
      return mark.current;
    } else {
      return (mark.current = new Mark(contentRef.current));
    }
  };

  const onClearHighlight = () => {
    setResults([]);
    setCurrent(-1);

    if (mark.current) {
      mark.current.unmark();
    }
  };

  useEffect(() => {
    if (term) {
      window.setTimeout(() => {
        console.log(`Highlighting search term: '${term}'`);

        const highlight_start = performance.now();
        const instance = getMarkInstance();

        instance.unmark();
        instance.mark(term, {
          separateWordSearch: true,
          done: () => {
            const new_results = Array.prototype.slice.call(
              contentRef.current.querySelectorAll("mark")
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
          },
        });
      }, 100);
    }
  }, [term, location.pathname]);

  return (
    <div ref={contentRef} className={results.length > 0 ? "has-highlight-results" : ""}>
      {children}
      <HighlightControls
        current={current}
        setCurrent={setCurrent}
        results={results}
        onClear={onClearHighlight}
      />
    </div>
  );
};

const ContentHeader = ({ authors, tags, content }) => {
  return (
    <header className="post-header">
      <h1>{content.title}</h1>
      <ul className="bullet-list">
        {content.tags
          .map((tag) => tags[tag])
          .filter((tag) => tag.visibility == "public")
          .map((tag) => (
            <li key={tag.id}>
              <Link to={"/tags/" + tag.slug} title={tag.description}>
                {tag.name}
              </Link>
            </li>
          ))}
      </ul>
      {content.custom_excerpt ? <p>{content.custom_excerpt}</p> : null}
      <PostDetails authors={authors} post={content} />
    </header>
  );
};

const getHighlightTerm = (location) => {
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

const ContentBody = ({ content }) => {
  const location = useLocation();
  const searchTerm = getHighlightTerm(location);

  return (
    <SearchHighlighter term={searchTerm}>
      <SyntaxHighlighter>
        <div className="post-content">
          <div className="inner" dangerouslySetInnerHTML={{ __html: content.html }}></div>
        </div>
        <ScrollToTopButton />
      </SyntaxHighlighter>
    </SearchHighlighter>
  );
};

const Content = ({ authors, tags, content }) => {
  return (
    <article className="post">
      <ContentHeader authors={authors} tags={tags} content={content} />
      <ContentBody content={content} />
    </article>
  );
};

export default Content;
