import { Decoder, Encoder } from "./store";
import { IndexTerm } from "./term";
import { Trie, TrieNode, TrieNodeVisitor } from "./trie";
import { stemmer, STEM_WORDS } from "./stem";
import { MarkdownExtractor } from "./markdown";

const MAGIC = 0x53524348;
const WORD_RE = /[\w_][\w_-]{2,}/g;

export class IndexDocument {
  public page: boolean;
  public id: number;
  public slug: string;
  public title: string;
  public excerpt: string;

  public get url(): string {
    return this.page ? `/${this.slug}` : `/blog/${this.slug}`;
  }

  constructor(
    page: boolean,
    id: number,
    slug: string,
    title: string,
    excerpt: string
  ) {
    this.page = page;
    this.id = id;
    this.slug = slug;
    this.title = title;
    this.excerpt = excerpt;
  }

  encode(encoder: Encoder) {
    encoder.encode7((this.id << 1) | (this.page ? 0x01 : 0x00));
    encoder.encodeUtf8(this.slug);
    encoder.encodeUtf8(this.title);
    encoder.encodeUtf8(this.excerpt);
  }

  static decode(decoder: Decoder): IndexDocument {
    const id = decoder.decode7();
    const slug = decoder.decodeUtf8();
    const title = decoder.decodeUtf8();
    const excerpt = decoder.decodeUtf8();

    return new IndexDocument(
      (id & 0x01) === 0x01,
      id >> 1,
      slug,
      title,
      excerpt
    );
  }
}

export class IndexBuilder {
  public documents: { [id: string]: IndexDocument } = {};
  public terms: Map<string, IndexTerm> = new Map();

  public addTerm(term: string, key: number) {
    let ix_term = this.terms.get(term);
    if (!ix_term) {
      ix_term = new IndexTerm(term);
      this.terms.set(term, ix_term);
    }

    ix_term.addOccurrence(key);
  }

  public addTermsFrom(input: string, key: number) {
    for (let match of [...input.matchAll(WORD_RE)]) {
      const term = stemmer(match[0].toLowerCase());

      if (term.length === 0) {
        continue;
      }

      if (STEM_WORDS.includes(term)) {
        continue;
      }

      this.addTerm(term, key);
    }
  }

  public addDocument(
    page: boolean,
    slug: string,
    title: string,
    excerpt: string,
    content: string
  ): IndexDocument {
    const id = Object.keys(this.documents).length;
    const doc = new IndexDocument(page, id, slug, title, excerpt);

    this.documents[id] = doc;
    this.addTermsFrom(doc.excerpt, id);

    for (let block of MarkdownExtractor.extract(content)) {
      this.addTermsFrom(block, id);
    }

    return doc;
  }

  public prepare(): PreparedIndex {
    return new PreparedIndex(this);
  }
}

export interface SearchResult {
  document: IndexDocument;
  score: number;
}

export class PreparedIndex {
  private documents: { [id: string]: IndexDocument } = {};
  private trie: Trie = new Trie();

  constructor(builder?: IndexBuilder) {
    if (builder) {
      this.documents = Object.assign({}, builder.documents);
      for (let [_, value] of builder.terms) {
        this.trie.insertTerm(value);
      }
    }
  }

  search(terms: string[]): SearchResult[] {
    interface DocResult {
      docId: number;
      termFreqs: { [key: string]: number };
    }

    terms = terms
      .map((term) => stemmer(term))
      .filter((term) => term.length > 0 && !STEM_WORDS.includes(term));

    const term_docs: { [doc_id: string]: DocResult } = {};
    terms.forEach((term) => {
      const occs = this.trie.findTerm(term);
      Object.keys(occs).forEach((doc_id) => {
        if (doc_id in term_docs) {
          term_docs[doc_id].termFreqs[term] += occs[doc_id];
        } else {
          term_docs[doc_id] = {
            docId: parseInt(doc_id),
            termFreqs: terms.reduce((freqs, t) => {
              freqs[t] = t === term ? occs[doc_id] : 0;
              return freqs;
            }, {} as { [key: string]: number }),
          };
        }
      });
    });

    const term_freqs = terms.reduce((freqs, term) => {
      freqs[term] = 0;
      return freqs;
    }, {} as { [term: string]: number });

    Object.keys(term_docs).forEach((doc_id) => {
      const doc = term_docs[doc_id];
      for (let term of terms) {
        term_freqs[term] += doc.termFreqs[term];
      }
    });

    const doc_count = Object.keys(this.documents).length;
    terms.forEach((term) => {
      term_freqs[term] = Math.log10(doc_count / term_freqs[term]);
    });

    return Object.keys(term_docs)
      .reduce((results, doc_id) => {
        const doc = term_docs[doc_id];
        let score = 0;

        for (let term of terms) {
          const freq = doc.termFreqs[term];
          if (freq === 0) {
            return results;
          }

          score += freq * term_freqs[term];
        }

        results.push({ document: this.documents[doc_id], score });
        return results;
      }, [] as SearchResult[])
      .sort((a, b) => b.score - a.score);
  }

  encode(encoder: Encoder) {
    encoder.encode32(MAGIC);
    encoder.encode7(Object.keys(this.documents).length);

    for (let id in this.documents) {
      this.documents[id].encode(encoder);
    }

    this.trie.encode(encoder);
  }

  decode(decoder: Decoder) {
    const magic = decoder.decode32();
    if (magic != MAGIC) {
      throw new Error(
        `Incorrect file magic in index data (expected ${MAGIC.toString(
          16
        )}, found ${magic.toString(16)})`
      );
    }

    let ndocuments = decoder.decode7();
    while (ndocuments-- > 0) {
      const doc = IndexDocument.decode(decoder);
      this.documents[doc.id] = doc;
    }

    this.trie.decode(decoder);
  }

  describe() {
    class Logger implements TrieNodeVisitor {
      public index: PreparedIndex;
      public codes: number[] = [];

      constructor(index: PreparedIndex) {
        this.index = index;
      }

      enterNode(node: TrieNode) {
        this.codes.push(node.key);
      }

      leaveNode(node: TrieNode) {
        const occ_keys = Object.keys(node.occurrences);

        if (occ_keys.length > 0) {
          console.log(
            `Term '${new TextDecoder("utf-8").decode(
              new Uint8Array(this.codes)
            )}':`
          );

          occ_keys.forEach((doc_id) => {
            console.log(
              `  ${doc_id}: ${node.occurrences[doc_id]} time(s) (${this.index.documents[doc_id].slug})`
            );
          });
        }

        this.codes.pop();
      }
    }

    this.trie.root.visit(new Logger(this));
  }
}
