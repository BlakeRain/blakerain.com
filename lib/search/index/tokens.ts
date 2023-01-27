import stemmer from "./stem";
import isStopWord from "./stop";

const SEPARATOR_RE = /[\W]+/;
const IDENTIFIER_RE = /[\w_-]+/g;

export class Token {
  public start: number;
  public length: number;
  public text: string;

  constructor(start: number, length: number, text: string) {
    this.start = start;
    this.length = length;
    this.text = text;
  }
}

export function tokenizePhrasing(input: string): Token[] {
  input = input.toLowerCase();

  const tokens: Token[] = [];
  for (let end = 0, start = 0; end <= input.length; ++end) {
    const char = input.charAt(end);
    const len = end - start;

    if (char.match(SEPARATOR_RE) || end == input.length) {
      if (len > 0) {
        let text = input
          .slice(start, end)
          .replace(/^\W+/, "")
          .replace(/\W+$/, "");

        if (text.length > 0 && !isStopWord(text)) {
          let token = new Token(start, len, stemmer(text));
          tokens.push(token);
        }
      }

      start = end + 1;
    }
  }

  return tokens;
}

export function tokenizeCode(input: string): Token[] {
  const tokens: Token[] = [];

  for (const match of input.matchAll(IDENTIFIER_RE)) {
    const parts = match[0].split(/[_]+/);
    let offset = 0;

    for (let i = 0; i < parts.length; ++i) {
      for (const subpart of parts[i].split(/(?=[A-Z])/)) {
        if (subpart.length > 2) {
          tokens.push(
            new Token(
              (match.index || 0) + offset,
              subpart.length,
              subpart.toLowerCase()
            )
          );
        }

        offset += subpart.length;
      }

      offset += 1;
    }
  }

  return tokens;
}
