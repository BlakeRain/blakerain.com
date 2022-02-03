import { Encoder, Decoder } from "./store";
import { IndexTerm } from "./term";

/**
 * An occurrence map for a term
 *
 * This represents a mapping from a document key (the unique numerical ID for a documentT) to a count of
 * occurrences.
 *
 * This is used to represent the number of times that a given term occurrs in a particular document.
 */
export type Occurrences = Map<number, number>;

/**
 * A node in an index trie
 *
 * Each node of the trie has a key, being a UTF-8 code point. Each node also contains a set of children, indexed by
 * their UTF-8 code point along with the occurrence map for the term (if any).
 */
export class TrieNode {
  public key: number;
  public children: Map<number, TrieNode> = new Map();
  public occurrences: Occurrences = new Map();

  constructor(key: number) {
    this.key = key;
  }

  /**
   * Visit this node using a TrieNodeVisitor
   *
   * This method will call `TrieNodeVisitor.enterNode` for this node, and then visit each of the children of the
   * node. Once the children have all been visited, then `TrieNodeVisitor.leaveNode` is called.
   */
  visit(visitor: TrieNodeVisitor) {
    visitor.enterNode(this);

    for (const child of this.children.values()) {
      child.visit(visitor);
    }

    visitor.leaveNode(this);
  }

  /**
   * Decode this trie node from the given `Decoder`.
   *
   * This will read the code point (as a VLQ) from the `Decoder`. The VLQ stored in the `Decoder` has it's lower
   * two bits reserved for flags:
   *
   * - If the least significant bit is set (bit 0), then there is another node following on from this one.
   * - If bit 1 is set, then this node has an occurrences map.
   *
   * If bit 1 is set, then this method will read the number of occurrences as a VLQ from the `Decoder`, followed by
   * as many occurrence key and count pairs.
   *
   * @param decoder The `Decoder` to read from
   * @returns Whether there is a subsequent node
   */
  decode(decoder: Decoder): boolean {
    // Get the tagged key value
    const key = decoder.decode7();

    // The lower two bits of the key are the flag bits
    this.key = key >> 2;

    if (key & 0x02) {
      let noccurrences = decoder.decode7();
      while (noccurrences-- > 0) {
        const documentKey = decoder.decode7();
        this.occurrences.set(documentKey, decoder.decode7());
      }
    }

    return (key & 0x01) === 0x01;
  }
}

/**
 * A container for a trie
 *
 * A trie is a form of prefix tree, where each node is used to represent a UTF-8 code point in a set of terms. The
 * search index uses a trie to facilitate a simple form of search function.
 *
 * This class encapsulates a single root `TrieNode` that represents the index. A number of methods are provided to
 * encode and decode the trie to and from binary data. Another set of methods are defined for finding occurrences of
 * a full or partial term (hence "prefix") in the trie.
 */
export class Trie {
  public root: TrieNode;

  constructor() {
    this.root = new TrieNode(0);
  }

  /**
   * Insert the given term into this trie.
   *
   * This will insert the given term into this trie. This involves creating nodes in the trie for each UTF-8
   * code-point in the term and inserting them into the trie. The leaves of the trie contain the occurrence map
   * from the term.
   *
   * @param term The `IndexTerm` to insert into the trie.
   */
  insertTerm(term: IndexTerm) {
    var node = this.root;
    for (let cp of term.term) {
      let child = node.children.get(cp);
      if (!child) {
        child = new TrieNode(cp);
        node.children.set(cp, child);
      }

      node = child;
    }

    node.occurrences = term.occurrences;
  }

  /**
   * Find a string in the trie
   *
   * This method takes a prefix string and descends the trie, following each UTF-8 code point in the given prefix.
   *
   * After the final node is reached, a call to `findOccurrences` is used to gather all the possible occurrences of
   * the term from the children.
   *
   * @param prefix The prefix to search for
   * @returns A collection of term occurrences for the given prefix
   */
  findTerm(prefix: string): Occurrences | undefined {
    var node = this.root;

    for (let code of new TextEncoder().encode(prefix)) {
      const child = node.children.get(code);
      if (!child) {
        return undefined;
      }

      node = child;
    }

    if (!node) {
      return undefined;
    }

    const occurrences = new Map();
    this.findOccurrences(node, occurrences);
    return occurrences;
  }

  /**
   * Collect all the occurrences of the given node
   *
   * This function will descend all the branches of the given node and build up an `Occurrences` map, giving the
   * occurrence count for the node (and it's descendents) under each document ID.
   *
   * @param node The node to start from
   * @param occurrs The set of occurrences to update
   */
  findOccurrences(node: TrieNode, occurrs: Occurrences) {
    for (const [key, value] of node.occurrences) {
      const count = occurrs.get(key);
      if (!count) {
        occurrs.set(key, value);
      } else {
        occurrs.set(key, count + value);
      }
    }

    for (const child of node.children.values()) {
      this.findOccurrences(child, occurrs);
    }
  }

  /**
   * Encode this trie
   *
   * This will encode this trie into the given `Encoder`
   *
   * @param encoder The `Encoder` into which the trie should be encoded
   */
  encode(encoder: Encoder) {
    const visitor = new StorageTrieNodeVisitor(encoder);
    this.root.visit(visitor);
    visitor.retrace();
  }

  /**
   * Decode this trie
   *
   * This will decode a trie from the given `Decoder`.
   *
   * After decoding a node, the `TrieNode.decode` method will indicate whether there are child nodes immediately
   * following the decoded node. The decode process uses a stack to maintain the current node being decoded (rather
   * than excessive recursion). When a decoded trie node does not have any children (a leaf), the node is followed
   * by a VLQ indicating the number of ancestors to discard from the stack.
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
   * This trie will be encoded as a series of instructions into the index data as follows:
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
   * This encodes the trie in 29 bytes.
   *
   * @param decoder The decoder from which to decode a trie.
   */
  decode(decoder: Decoder) {
    this.root = Trie.decodeTrie(decoder);
  }

  static decodeTrie(decoder: Decoder): TrieNode {
    let stack: TrieNode[] = [];
    let root: TrieNode | null = null;

    for (;;) {
      // Create the node and decode it. The decode method will indicate whether we should expected another node
      // to immediately follow, or if this was a leaf node.
      const parent = stack.length > 0 ? stack[stack.length - 1] : null;
      const node = new TrieNode(0);
      const hasChildren = node.decode(decoder);

      stack.push(node);

      if (!root) {
        root = node;
      }

      if (parent) {
        parent.children.set(node.key, node);
      }

      if (!hasChildren) {
        // This was a leaf node (no children), so we want to pop the stack to get to the parent. The number of
        // nodes to pop is encoded in the stream.
        let pop = decoder.decode7();

        while (pop-- > 0) {
          stack.pop();
        }

        // If we came to the end of the stack, then we're done decoding
        if (stack.length === 0) {
          break;
        }
      }
    }

    return root;
  }
}

export interface TrieNodeVisitor {
  enterNode(node: TrieNode): void;
  leaveNode(node: TrieNode): void;
}

class StorageTrieNodeVisitor implements TrieNodeVisitor {
  private encoder: Encoder;
  private leaveCount: number = 0;

  constructor(encoder: Encoder) {
    this.encoder = encoder;
  }

  retrace() {
    if (this.leaveCount > 0) {
      this.encoder.encode7(this.leaveCount);
      this.leaveCount = 0;
    }
  }

  enterNode(node: TrieNode) {
    // Retrace our steps back to the parent node
    this.retrace();

    // Tag the TrieNode key with some flags
    var key = node.key << 2;

    if (node.children.size > 0) {
      key |= 0x01;
    }

    if (node.occurrences.size > 0) {
      key |= 0x02;
    }

    // Store the tagged TrieNode key
    this.encoder.encode7(key);

    // If this node has occurrences, store them
    if (node.occurrences.size > 0) {
      this.encoder.encode7(node.occurrences.size);
      for (const [key, value] of node.occurrences) {
        this.encoder.encode7(key);
        this.encoder.encode7(value);
      }
    }
  }

  leaveNode() {
    ++this.leaveCount;
  }
}
