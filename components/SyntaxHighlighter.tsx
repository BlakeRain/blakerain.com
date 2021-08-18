import { FC, useEffect, useRef } from "react";
import { Prism as SyntaxHighlighten } from "react-syntax-highlighter";

const SyntaxHighlighter: FC = (props) => {
  // const contentRef = useRef<HTMLDivElement>(null);

  // useEffect(() => {
  //   var highlight_count = 0;
  //   const highlight_start = performance.now();

  //   if (!contentRef.current) {
  //     return;
  //   }

  //   Prism.highlightAll(false, (element) => {
  //     console.log("Highlighting", element);
  //   });

  // contentRef.current.querySelectorAll('code[class*="language-"]').forEach((element) => {
  //   Prism.highlightElement(element, false, () => {
  //     ++highlight_count;
  //   });
  // });

  // if (highlight_count > 0) {
  //   console.log(
  //     `Completed syntax highlighting of ${highlight_count} element(s) in ${(
  //       performance.now() - highlight_start
  //     ).toFixed(2)} ms`
  //   );
  // }
  // }, []);

  // return <div ref={contentRef}>{props.children}</div>;
  return <SyntaxHighlighten>{props.children}</SyntaxHighlighten>;
};

export default SyntaxHighlighter;
