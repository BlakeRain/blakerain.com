/**
 * A decoder for the search data
 *
 * This provides two functions: decoding a variable length quantity, and decoding a VLQ-prefixed
 * UTF-8 string.
 */
export class SearchDecoder {
  public buffer: ArrayBuffer;
  public offset: number;
  public view: DataView;

  constructor(buffer: ArrayBuffer) {
    this.buffer = buffer;
    this.offset = 0;
    this.view = new DataView(this.buffer);
  }

  /**
   * Decode a variable length quantity from the buffer
   *
   * @returns The decoded integer
   */
  public decode7(): number {
    var byte = 0,
      value = 0,
      shift = 0;

    do {
      byte = this.view.getUint8(this.offset++);
      value |= (byte & 0x7f) << shift;
      shift += 7;
    } while (byte >= 0x80);

    return value;
  }

  /**
   * Decode a length-prefixed (VLQ) UTF-8 string from the buffer
   *
   * @returns The decoded string
   */
  public decodeUtf8(): string {
    const len = this.decode7();
    const str = new TextDecoder("utf-8").decode(
      new DataView(this.buffer, this.offset, len)
    );
    this.offset += len;
    return str;
  }
}

/**
 * An occurrence of a post
 *
 * At each leaf of the trie are stored a number of occurrences, indicating the number of times
 * the terminal word occurs in each post.
 */
export class SearchOccurrence {
  public post: number;
  public count: number;

  constructor(decoder: SearchDecoder) {
    this.post = decoder.decode7();
    this.count = decoder.decode7();
  }
}

export interface SearchStats {
  noccurrences: number;
  count: number;
  maxDepth: number;
  maxPopDistance: number;
  totalPopDistance: number;
  nterms: number;
}

/**
 * A node in the trie
 *
 * Each node of the trie has a key (the character code for this node) along with a number of
 * occurrences (see SearchOccurrence) and any child nodes.
 */
export class TrieNode {
  public key: number;
  public parent: TrieNode | null;
  public children: { [key: number]: TrieNode };
  public occurrences: SearchOccurrence[];

  constructor(key: number, parent: TrieNode | null) {
    this.key = key;
    this.parent = parent || null;
    this.children = {};
    this.occurrences = [];
  }

  /**
   * Get the word for this node
   *
   * This will walk up the trie to the eventual root, gathering the character for each ancestor,
   * finally returning the result as a string. This string corresponds to the (possibly partial)
   * word represented by this node in the trie.
   *
   * @returns The possibly partial word constructed so far for this node
   */
  getWord(): string {
    let output: string[] = [];
    var node: TrieNode | null = this;

    while (node !== null) {
      if (node.key !== 0) {
        output.unshift(String.fromCharCode(node.key));
      }

      node = node.parent;
    }

    return output.join("");
  }

  /**
   * Decode this trie node from the given data
   *
   * This will read the character key (as a VLQ) from the data. The VLQ stored in the data has
   * it's lower two bits reserved for flags:
   *
   * - If the least significant bit is set (bit 0) then there is another node following on from
   *   this one.
   * - If bit 1 is set, then this node has occurrences.
   *
   * If bit 1 is set then this method will read the number of occurrences (encoded as a VLQ)
   * from the data, followed by as many `SearchOccurrence` objects.
   *
   * @param {SearchDecoder} decoder The decoder from which to read the data
   * @param {object} stats The (optional) statistics object
   * @returns Whether there is another node after this one in the data
   */
  decode(decoder: SearchDecoder, stats: SearchStats): boolean {
    const key = decoder.decode7();

    // The lower two bits of the key are flag bits
    this.key = key >> 2;

    if (key & 0x02) {
      const noccurrences = decoder.decode7();
      for (var i = 0; i < noccurrences; ++i) {
        const occurrence = new SearchOccurrence(decoder);
        this.occurrences.push(occurrence);

        if (stats) {
          stats.noccurrences += occurrence.count;
        }
      }
    }

    if (stats) {
      stats.count++;
    }

    return (key & 0x01) == 0x01;
  }
}

/**
 * A container for a trie
 *
 * A trie is a form of prefix-tree, where each node is used to represent a letter in a set of
 * words. The search data uses a trie to facilitate a simple form of search function.
 *
 * This class encapsulates a single root `TrieNode` that represents the search data. A number of
 * methods are provided to perform decoding of the entire trie and finding occurrences in the
 * trie for a specific prefix.
 */
export class Trie {
  public root: TrieNode | null;

  constructor() {
    this.root = null;
  }

  /**
   * Decode a trie from the given decoder.
   *
   * This decodes the trie using the `decodeTrie` method, assigning the result to the `root`
   * property of this object.
   *
   * @param {SearchDecoder} decoder The decoder from which to read the data
   * @param {object} stats Optional statistics object
   */
  decode(decoder: SearchDecoder, stats: SearchStats) {
    this.root = Trie.decodeTrie(decoder, stats);
  }

  /**
   * Find a string in the trie
   *
   * This method takes a prefix string and descends the trie, following each character in the
   * given prefix. After which the `findOccurrences` method is used to gather all the possible
   * occurrences (as `SearchOccurrence` instances) from the children.
   *
   * @param {string} prefix The prefix to search for
   * @returns A collection of results as an array of `SearchOccurrence`
   */
  findString(prefix: string): SearchOccurrence[] {
    var node = this.root;

    for (var i = 0; i < prefix.length; ++i) {
      let ch = prefix.charCodeAt(i);

      if (node && ch in node.children) {
        node = node.children[ch];
      } else {
        return [];
      }
    }

    if (!node) {
      return [];
    }

    return this.findOccurrences(node, []);
  }

  /**
   * Collect all occurrences from the given node
   *
   * @param {TrieNode} node The starting point of the collection
   * @param {SearchOccurrence[]} output The array into which the occurrences are inserted
   * @returns The result of the collection (as an array of `SearchOccurrence`)
   */
  findOccurrences(node: TrieNode, output: SearchOccurrence[]) {
    if (node.occurrences.length > 0) {
      output = output.concat(node.occurrences);
    }

    for (var child in node.children) {
      output = this.findOccurrences(node.children[child], output);
    }

    return output;
  }

  /**
   * Decode a trie from some data
   *
   * This function handles the decoding of an entire trie from a `SearchDecoder` instance,
   * returning the root of the trie.
   *
   * After decoding a node, the `TrieNode.decode` method indicates whether there are child nodes
   * immediately following the decoded node. The decoding process uses a stack to maintain the
   * current node being decoded (rather than excessive recursion). When a decoded trie node does
   * not have any children, the node is followed by a VLQ indicating the number of ancestors to
   * discard.
   *
   * As an example, consider the following simple trie:
   *
   * ```
   *          +
   *         / \
   *        /   \
   *       /     \
   *      B       C
   *     / \      |
   *    /   \     |
   *   E     I    A
   *  / \    |   / \
   * L   N   N  T   R
   * |
   * L
   * ```
   *
   * This trie represents the words `BELL`, `BEN`, `BIN`, `CAT` and `CAR`.
   *
   * This trie will be encoded as a series of instructions into the search data as follows:
   *
   * | Data Type | Arguments      | Stack                         | Encoding |
   * | --------- | -------------- | ----------------------------- | -------- |
   * | Node      | `{ key: 0 }`   | `[Root]`                      | `01`     |
   * | Node      | `{ key: B }`   | `[Root,B]`                    | `89 02`  |
   * | Node      | `{ key: E }`   | `[Root,B,E]`                  | `95 02`  |
   * | Node      | `{ key: L }`   | `[Root,B,E,L]`                | `B1 02`  |
   * | Node      | `{ key: L }`   | `[Root,B,E,L,L]`              | `B0 02`  |
   * | Pop       | `{ count: 2 }` | `[Root,B,E]` (popped `[L,L]`) | `02`     |
   * | Node      | `{ key: N }`   | `[Root,B,E,N]`                | `B8 02`  |
   * | Pop       | `{ count: 2 }` | `[Root,B]` (popped `[E,N]`)   | `02`     |
   * | Node      | `{ key: I }`   | `[Root,B,I]`                  | `A5 02`  |
   * | Node      | `{ key: N }`   | `[Root,B,I,N]`                | `B8 02`  |
   * | Pop       | `{ count: 3 }` | `[Root]` (popped `[B,I,N]`)   | `03`     |
   * | Node      | `{ key: C }`   | `[Root,C]`                    | `8D 02`  |
   * | Node      | `{ key: A }`   | `[Root,C,A]`                  | `85 02`  |
   * | Node      | `{ key: T }`   | `[Root,C,A,T]`                | `D0 02`  |
   * | Pop       | `{ count: 1 }` | `[Root,C,A]` (popped `[T]`)   | `01`     |
   * | Node      | `{ key: R }`   | `[Root,C,A,R]`                | `C8 02`  |
   * | Pop       | `{ count: 3 }` | `[Root]` (popped `[C,A,R]`)   | `03`     |
   * | Pop       | `{ count: 1 }` | `[]` (end of trie)            | `01`     |
   *
   * @param {SearchDecoder} decoder The decoder from which to read data
   * @param {object} stats The optional stats object
   * @returns The root trie node
   */
  static decodeTrie(decoder: SearchDecoder, stats: SearchStats): TrieNode {
    let stack: TrieNode[] = [];
    let root: TrieNode | null = null;

    for (;;) {
      // Create the node and decode it. The decode method will indicate whether we should expect
      // another node to immediately follow, or if this was a leaf node.
      const parent = stack.length > 0 ? stack[stack.length - 1] : null;
      const node = new TrieNode(0, parent);
      const has_children = node.decode(decoder, stats);

      stack.push(node);

      if (stats) {
        stats.maxDepth = Math.max(stats.maxDepth, stack.length);
      }

      if (!root) {
        root = node;
      }

      if (parent) {
        parent.children[node.key] = node;
      }

      if (!has_children) {
        // This was a leaf node, so we want to pop the stack to get to the parent. The number of
        // nodes to pop is encoded in the stream.
        let pop = decoder.decode7();

        if (stats) {
          stats.maxPopDistance = Math.max(stats.maxPopDistance, pop);
          stats.totalPopDistance += pop;
          ++stats.nterms;
        }

        while (pop-- > 0) {
          stack.pop();
        }

        // If we came to the end of the stack, then we're done decoding.
        if (stack.length === 0) {
          break;
        }
      }
    }

    return root;
  }
}

/**
 * A post (or a page) in the search data
 *
 * Each post is encoded as a numerical ID (used in a `SearchOccurrence`), an indicator as to
 * whether this is a post or a page (effecting the URL), the title of the post and the slug.
 */
export class SearchPost {
  public id: number;
  public isPage: boolean;
  public title: string;
  public slug: string;

  constructor(decoder: SearchDecoder) {
    const id_flags = decoder.decode7();
    this.id = id_flags >> 1;
    this.isPage = (id_flags & 0x01) != 0;
    this.title = decoder.decodeUtf8();
    this.slug = decoder.decodeUtf8();
  }

  get url() {
    return (this.isPage ? "/" : "/blog/") + this.slug;
  }
}

/**
 * The search data
 *
 * This class encapsulates the search data and provides the high-level decoding of posts and
 * the search trie.
 */
export class SearchData {
  public posts: { [key: number]: SearchPost };
  public trie: Trie;

  /**
   * Construct a new search data object, decoding from a given buffer
   *
   * @param {ArrayBuffer} encoded The encoded data
   */
  constructor(encoded: ArrayBuffer) {
    // We want to record some performance information, so store the point where we start
    let t0 = performance.now();

    // Create a decoder to decode data from the buffer
    let decoder = new SearchDecoder(encoded);

    // Read the file magic
    let magic = decoder.view.getUint32(decoder.offset);
    decoder.offset += 4;
    if (magic !== 0x53524348) {
      throw new Error("Incorrect file magic in search data (expected 'SRCH')");
    }

    // Decode the number of posts in the search data
    let num_posts = decoder.decode7();

    // Read all the posts into an object. Each post is stored as a property in the object, where
    // the name of the property is the ID of the post. This makes it easier for us to look up
    // a `SearchPost` that corresponds to a `SearchOccurrence`.

    this.posts = {};
    for (let i = 0; i < num_posts; ++i) {
      let post = new SearchPost(decoder);
      this.posts[post.id] = post;
    }

    // Decode the term trie

    let term_stats: SearchStats = {
      count: 0,
      maxDepth: 0,
      maxPopDistance: 0,
      totalPopDistance: 0,
      nterms: 0,
      noccurrences: 0,
    };

    this.trie = new Trie();
    this.trie.decode(decoder, term_stats);

    // Record how long it too us to decode
    let t1 = performance.now();
    console.log(
      `Decoded ${num_posts} posts and ${
        term_stats.count
      } term trie nodes covering ${term_stats.nterms} terms occurring ${
        term_stats.noccurrences
      } times, in ${(t1 - t0).toFixed(2)} milliseconds from ${(
        encoded.byteLength / 1024.0
      ).toFixed(2)} Kb search database`
    );

    console.log(
      `Term trie decoding had a maximum stack depth of ${
        term_stats.maxDepth
      }, popping at most ${term_stats.maxPopDistance} nodes (avg. ${(
        term_stats.totalPopDistance / term_stats.nterms
      ).toFixed(2)} per term)`
    );
  }
}
