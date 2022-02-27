import { Decoder, Encoder } from "./store";
import { IndexTerm } from "./term";
import { Trie, TrieNode, TrieNodeVisitor } from "./trie";
import { stemmer, STEM_WORDS } from "./stem";

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
  public documents: Map<number, IndexDocument> = new Map();
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

  public async addDocument(
    page: boolean,
    slug: string,
    title: string,
    excerpt: string,
    content: string
  ): Promise<IndexDocument> {
    const id = this.documents.size;
    const doc = new IndexDocument(page, id, slug, title, excerpt);

    this.documents.set(id, doc);
    this.addTermsFrom(doc.excerpt, id);

    const { MarkdownExtractor } = await import("./markdown");
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
  private documents: Map<number, IndexDocument> = new Map();
  private trie: Trie = new Trie();

  constructor(builder?: IndexBuilder) {
    if (builder) {
      this.documents = builder.documents;
      for (let [_, value] of builder.terms) {
        this.trie.insertTerm(value);
      }
    }
  }

  search(terms: string[]): SearchResult[] {
    interface DocResult {
      docId: number;
      termFreqs: Map<string, number>;
    }

    terms = terms
      .map((term) => stemmer(term))
      .filter((term) => term.length > 0 && !STEM_WORDS.includes(term));

    const term_docs: Map<number, DocResult> = new Map();
    terms.forEach((term) => {
      // See if we have any occurrences for this term
      const occs = this.trie.findTerm(term);

      if (occs) {
        // Iterate over the occurrence results and merge them into 'term_docs'
        for (const [doc_id, occ] of occs) {
          // Get the current aggregated occurrences
          let doc_res = term_docs.get(doc_id);

          // If we don't have a 'DocResult' for this document, create a new
          // one, and add it to 'term_docs'.
          if (!doc_res) {
            doc_res = { docId: doc_id, termFreqs: new Map() };
            for (let term of terms) {
              doc_res.termFreqs.set(term, 0);
            }

            term_docs.set(doc_id, doc_res);
          }

          // Add the occurrence of this term into this 'DocResult'
          const freq = doc_res.termFreqs.get(term);
          doc_res.termFreqs.set(term, occ + (freq || 0));
        }
      }
    });

    const term_freqs = terms.reduce((freqs, term) => {
      freqs.set(term, 0);
      return freqs;
    }, new Map<string, number>());

    for (const doc of term_docs.values()) {
      for (let term of terms) {
        const count = term_freqs.get(term);
        term_freqs.set(term, (count || 0) + (doc.termFreqs.get(term) || 0));
      }
    }

    const doc_count = this.documents.size;
    terms.forEach((term) => {
      const count = term_freqs.get(term) || 0;
      term_freqs.set(term, Math.log10(doc_count / count));
    });

    const results: SearchResult[] = [];
    for (const [doc_id, doc_res] of term_docs) {
      let score = 0;

      for (let term of terms) {
        const freq = doc_res.termFreqs.get(term) || 0;
        score += freq * (term_freqs.get(term) || 0);
      }

      const doc = this.documents.get(doc_id);
      if (doc) {
        results.push({ document: doc, score });
      }
    }

    return results.sort((a, b) => b.score - a.score);
  }

  encode(encoder: Encoder) {
    encoder.encode32(MAGIC);
    encoder.encode7(this.documents.size);

    for (let doc of this.documents.values()) {
      doc.encode(encoder);
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
    console.log(`Loaded ${ndocuments} document(s) from search data`);
    while (ndocuments-- > 0) {
      const doc = IndexDocument.decode(decoder);
      this.documents.set(doc.id, doc);
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
        if (node.occurrences.size > 0) {
          console.log(
            `Term '${new TextDecoder("utf-8").decode(
              new Uint8Array(this.codes)
            )}':`
          );

          for (const doc_id of node.occurrences.keys()) {
            const doc = this.index.documents.get(doc_id);
            console.log(
              `  ${doc_id}: ${node.occurrences.get(doc_id)} time(s) (${
                doc ? doc.slug : "???"
              })`
            );
          }
        }

        this.codes.pop();
      }
    }

    this.trie.root.visit(new Logger(this));
  }
}
