import { marked } from "marked";

export class MarkdownExtractor {
  private blocks: string[] = [];

  private addBlock(block: string) {
    if (typeof block !== "string") {
      throw new Error("Expected markdown block to be a string");
    }

    if (block.length > 0) {
      console.log(`Adding block: ${block}`);
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
