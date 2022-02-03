import { Occurrences } from "./trie";

/**
 * A term in an index
 *
 * An `IndexTerm` is only used during the construction of a `IndexBuilder` to encapsulate a single term and
 * the occurrence map of that term (count of occurrnces in each document, by numerical document ID.
 *
 * Once an `IndexConstructor` has been finalized into a `PreparedIndex`, the terms are no longer used.
 */
export class IndexTerm {
  public term: Uint8Array;
  public occurrences: Occurrences = {};

  constructor(term: string) {
    this.term = new TextEncoder().encode(term);
  }

  /**
   * Record an occurrence of this term in the given document
   *
   * @param key The numerical ID of the document
   */
  addOccurrence(key: number) {
    if (key in this.occurrences) {
      this.occurrences[key]++;
    } else {
      this.occurrences[key] = 1;
    }
  }
}
