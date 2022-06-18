import { Light as SyntaxHighlighter } from "react-syntax-highlighter";

import bash from "react-syntax-highlighter/dist/cjs/languages/hljs/bash";
import cpp from "react-syntax-highlighter/dist/cjs/languages/hljs/cpp";
import css from "react-syntax-highlighter/dist/cjs/languages/hljs/css";
import js from "react-syntax-highlighter/dist/cjs/languages/hljs/javascript";
import nginx from "react-syntax-highlighter/dist/cjs/languages/hljs/nginx";
import rust from "react-syntax-highlighter/dist/cjs/languages/hljs/rust";
import python from "react-syntax-highlighter/dist/cjs/languages/hljs/python";

SyntaxHighlighter.registerLanguage("bash", bash);
SyntaxHighlighter.registerLanguage("cpp", cpp);
SyntaxHighlighter.registerLanguage("css", css);
SyntaxHighlighter.registerLanguage("javascript", js);
SyntaxHighlighter.registerLanguage("nginx", nginx);
SyntaxHighlighter.registerLanguage("rust", rust);
SyntaxHighlighter.registerLanguage("python", python);

export { SyntaxHighlighter };
