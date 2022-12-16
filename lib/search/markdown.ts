import { marked } from "marked";

export class MarkdownExtractor {
  private blocks: string[] = [];

  private addBlock(block: string) {
    if (typeof block !== "string") {
      throw new Error("Expected markdown block to be a string");
    }

    if (block.length > 0) {
      this.blocks.push(block);
    }
  }

  private processTable(table: marked.Tokens.Table) {
    for (let row of table.rows) {
      for (let cell of row) {
        this.processTokens(cell.tokens);
      }
    }
  }

  private processList(list: marked.Tokens.List) {
    for (let item of list.items) {
      this.processTokens(item.tokens);
    }
  }

  private processToken(token: marked.Token) {
    switch (token.type) {
      case "code":
      case "text":
      case "codespan":
        this.addBlock(token.text);
        if ("tokens" in token && token.tokens) {
          this.processTokens(token.tokens);
        }
        break;
      case "heading":
        this.addBlock(token.text);
        break;
      case "table":
        this.processTable(token);
        break;
      case "list":
        this.processList(token);
        break;
      case "link":
      case "image":
        if (token.title) {
          this.addBlock(token.title);
        }
        break;
      case "blockquote":
      case "paragraph":
      case "strong":
      case "em":
      case "del":
        this.processTokens(token.tokens);
        break;
      default:
        break;
    }
  }

  private processTokens(tokens: marked.Token[]) {
    for (let token of tokens) {
      this.processToken(token);
    }
  }

  constructor(content: string) {
    const tokens = marked.lexer(content);
    this.processTokens(tokens);
  }

  public static extract(source: string): string[] {
    const extractor = new MarkdownExtractor(source);
    return extractor.blocks;
  }
}

export class PlaintextMarkdownExtractor {
  private blocks: string[] = [];

  private addBlock(block: string) {
    if (typeof block !== "string") {
      throw new Error("Expected markdown block to be a string");
    }

    if (block.length > 0) {
      this.blocks.push(block);
    }
  }

  private code(token: marked.Tokens.Code) {
    if (token.lang) {
      this.addBlock("```" + token.lang);
    } else {
      this.addBlock("```");
    }

    this.addBlock(token.text);
    this.addBlock("```\n");
  }

  private heading(token: marked.Tokens.Heading) {
    const prefix = "#".repeat(token.depth);
    this.addBlock(`${prefix} ${token.text}\n`);
  }

  private table(token: marked.Tokens.Table) {
    this.addBlock(token.raw + "\n");
  }

  private paragraph(token: marked.Tokens.Paragraph) {
    const content = this.processSpanTokens(token.tokens);
    this.addBlock(content + "\n");
  }

  private list(token: marked.Tokens.List) {
    const generator = (
      typeof token.start === "number"
        ? () => {
            let index = token.start as number;
            return () => {
              const prefix = `${index}.`;
              index += 1;
              return prefix;
            };
          }
        : () => {
            return () => "-";
          }
    )();

    for (const item of token.items) {
      const prefix = generator();
      const content = this.processSpanTokens(item.tokens);
      this.addBlock(`${prefix} ${content}\n`);
    }
  }

  private processSpanTokens(tokens: marked.Token[]): string {
    const spans = [];

    for (const token of tokens) {
      switch (token.type) {
        case "text":
          spans.push(token.text);
          break;
      }
    }

    return spans.join("");
  }

  private processBlockToken(token: marked.Token) {
    switch (token.type) {
      case "code":
        this.code(token);
        break;
      case "heading":
        this.heading(token);
        break;
      case "table":
        this.table(token);
        break;
      case "paragraph":
        this.paragraph(token);
        break;
      case "list":
        this.list(token);
        break;
    }
  }

  private processBlockTokens(tokens: marked.Token[]) {
    for (let token of tokens) {
      this.processBlockToken(token);
    }
  }

  constructor(content: string) {
    const tokens = marked.lexer(content);
    this.processBlockTokens(tokens);
  }

  public static extract(content: string): string[] {
    const extractor = new PlaintextMarkdownExtractor(content);
    return extractor.blocks;
  }
}
