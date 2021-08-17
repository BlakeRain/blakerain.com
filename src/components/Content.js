import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "@reach/router";
import { createUseStyles } from "react-jss";
import Color from "color";

import PostDetails from "./PostDetails";
import { ScrollToTopButton } from "./ScrollToTop";
import TagList from "./TagList";
import { ColorDarkGrey, ColorMidGrey, PrimaryBackground } from "./Styles";

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

const useHighlightControlsStyles = createUseStyles({
  root: {
    position: "fixed",
    bottom: "1rem",
    right: "1rem",
    padding: "1rem",
    backgroundColor: PrimaryBackground.string(),
    borderRadius: 5,
    border: "1px solid rgba(0, 0, 0, 0.2)",
    boxShadow: "-1px 1px 3px rgba(0, 0, 0, 0.2)",
    zIndex: 50,
    fontSize: "80%",
  },
  button: {
    cursor: "pointer",
    color: "white",
    border: "none",
    backgroundColor: PrimaryBackground.darken(0.4).string(),
    borderRadius: 3,
    "&:hover": {
      backgroundColor: PrimaryBackground.lighten(1.2).string(),
    },
    "& + button": {
      marginLeft: "1rem",
    },
  },
  label: {
    marginLeft: "1rem",
  },
});

const HighlightControls = (props) => {
  const classes = useHighlightControlsStyles();

  function jumpTo(index) {
    index = index % props.results.length;
    if (index < props.results.length) {
      if (props.current !== -1) {
        props.results[props.current].className = "";
      }

      props.setCurrent(index);
      props.results[index].className = "current";
      props.results[index].scrollIntoView({
        behaviour: "smooth",
        block: "center",
      });
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
    <div className={classes.root}>
      <button type="button" className={classes.button} onClick={onNextClick}>
        &darr; Next
      </button>
      <button type="button" className={classes.button} onClick={onPrevClick}>
        &uarr; Previous
      </button>
      <button type="button" className={classes.button} onClick={onClearClick}>
        Clear
      </button>
      <span className={classes.label}>
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
              new_results[0].className = "current";
              new_results[0].scrollIntoView({
                behaviour: "smooth",
                block: "center",
              });
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

const useContentHeaderStyles = createUseStyles({
  root: {
    margin: [[0, "auto"]],
    padding: [70, 70, 50, 70],
  },
  title: {
    color: ColorDarkGrey.string(),
    margin: [0, 0, "0.2em", 0],
    fontSize: "5.5rem",
    fontWeight: 600,
    lineHeight: 1.15,
    "@media (prefers-color-scheme: dark)": {
      color: "rgba(255, 255, 255, 0.9)",
    },
  },
  excerpt: {
    margin: [20, 0, 0, 0],
    color: ColorMidGrey.string(),
    fontFamily: 'Georgia, "Times New Roman", Times, serif',
    fontSize: "2.3rem",
    lineHeight: "1.4em",
    fontWeight: 300,
    "@media (prefers-color-scheme: dark)": {
      color: ColorMidGrey.lighten(0.4).string(),
    },
  },
  postDetails: {
    borderTop: "1px solid #e4eaed",
    marginTop: "4rem",
    paddingTop: "2rem",
    "@media (prefers-color-scheme: dark)": {
      borderTopColor: "#3c414a",
    },
  },
});

const ContentHeader = ({ authors, tags, content }) => {
  const classes = useContentHeaderStyles();

  return (
    <header className={classes.root}>
      <h1 className={classes.title}>{content.title}</h1>
      <TagList tagsDict={tags} tagIds={content.tags} />
      {content.custom_excerpt ? (
        <p className={classes.excerpt}>{content.custom_excerpt}</p>
      ) : null}
      <PostDetails authors={authors} post={content} className={classes.postDetails} />
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
