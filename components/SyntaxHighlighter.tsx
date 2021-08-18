import { FC, useEffect, useRef } from "react";
import Prism from "prismjs";

import "prismjs/components/prism-python";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-css";
import "prismjs/components/prism-nginx";
import "prismjs/components/prism-c";
import "prismjs/components/prism-cpp";

const SyntaxHighlighter: FC = (props) => {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    var highlight_count = 0;
    const highlight_start = performance.now();

    if (!contentRef.current) {
      return;
    }

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
  }, []);

  return <div ref={contentRef}>{props.children}</div>;
};

export default SyntaxHighlighter;
