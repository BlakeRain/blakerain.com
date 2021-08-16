import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, navigate } from "@reach/router";

/**
 * A decoder for the search data
 *
 * This provides two functions: decoding a variable length quantity, and decoding a VLQ-prefixed
 * UTF-8 string.
 */
class SearchDecoder {
  constructor(buffer) {
    this.buffer = buffer;
    this.offset = 0;
    this.view = new DataView(this.buffer);
  }

  /**
   * Decode a variable length quantity from the buffer
   *
   * @returns The decoded integer
   */
  decode7() {
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
  decodeUtf8() {
    const len = this.decode7();
    const str = new TextDecoder("utf-8").decode(new DataView(this.buffer, this.offset, len));
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
class SearchOccurrence {
  constructor(decoder) {
    this.post = decoder.decode7();
    this.count = decoder.decode7();
  }
}

/**
 * A node in the trie
 *
 * Each node of the trie has a key (the character code for this node) along with a number of
 * occurrences (see SearchOccurrence) and any child nodes.
 */
class TrieNode {
  constructor(key, parent) {
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
  getWord() {
    let output = [];
    var node = this;

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
  decode(decoder, stats) {
    const key = decoder.decode7();

    // The lower two bits of the key are flag bits
    this.key = key >> 2;

    if (key & 0x02) {
      const noccurrences = decoder.decode7();
      for (let i = 0; i < noccurrences; ++i) {
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
class Trie {
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
  decode(decoder, stats) {
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
  findString(prefix) {
    var node = this.root;

    for (var i = 0; i < prefix.length; ++i) {
      let ch = prefix.charCodeAt(i);

      if (node.children[ch]) {
        node = node.children[ch];
      } else {
        return [];
      }
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
  findOccurrences(node, output) {
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
  static decodeTrie(decoder, stats) {
    let stack = [];
    let root = null;

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
class SearchPost {
  constructor(decoder) {
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
  /**
   * Construct a new search data object, decoding from a given buffer
   *
   * @param {ArrayBuffer} encoded The encoded data
   */
  constructor(encoded) {
    // We want to record some performance information, so store the point where we start
    let t0 = performance.now();

    // Create a decoder to decode data from the buffer
    let decoder = new SearchDecoder(encoded);

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

    let term_stats = { count: 0, maxDepth: 0, maxPopDistance: 0, nterms: 0, noccurrences: 0 };
    this.trie = new Trie();
    this.trie.decode(decoder, term_stats);

    // Record how long it too us to decode
    let t1 = performance.now();
    console.log(
      `Decoded ${num_posts} posts and ${term_stats.count} term trie nodes covering ${
        term_stats.nterms
      } terms occurring ${term_stats.noccurrences} times, in ${(t1 - t0).toFixed(
        2
      )} milliseconds from ${(encoded.byteLength / 1024.0).toFixed(2)} Kb search database`
    );

    console.log(
      `Term trie decoding had a maximum stack depth of ${term_stats.maxDepth}, popping at most ${term_stats.maxPopDistance} nodes`
    );
  }
}

// The URL from which we load the search data.
//
// By default we load the search data from a data file located in the 'data' directory under
// the site domain; however in development we can pass an environment variable that contains
// this location.

const SEARCH_DATA_URL = process.env.SEARCH_DATA_URL || "https://blakerain.com/data/search.bin";

/**
 * The search data provider component.
 *
 * This component provides the search data and visibility flag to it's child. This child is
 * then able to use the search data and visibility controls with a `<SearchContainer>`, or
 * other elements that require the search data and controls.
 *
 * Example usage:
 *
 * ```
 * const UsingSearch = (props) => {
 *   return (
 *     <div>
 *       <button type="button" onClick={props.setSearchVisible}>Open Search</button>
 *       <span>Search is {props.searchVisible ? "visible" : "invisible"}</span>
 *       <SearchContainer {... props} />
 *     </div>
 *   );
 * };
 *
 * <SearchProvider child={UsingSearch} />
 * ```
 */
export const SearchProvider = ({ child, childProps }) => {
  const Child = child;
  const searchData = useRef(null);
  const [searchVisible, setSearchVisible] = useState(false);

  // Load the search data from the URL, decode it and store the result in 'searchData'. This
  // function returns a promise that is resolved/rejected depending on whether the load was
  // successful or not.

  const loadSearchData = () => {
    return new Promise((resolve, reject) => {
      // Load the search data from the URL
      console.log("Loading search data from: " + SEARCH_DATA_URL);
      fetch(SEARCH_DATA_URL, { method: "GET", cache: "no-cache" })
        .then((response) => {
          // If we got the data okay, then we want to convert it to an 'ArrayBuffer'
          if (response.ok) {
            response
              .arrayBuffer()
              .then((buffer) => {
                // We have the search data as an 'ArrayBuffer', so we can construct a new
                // 'SearchData' which will parse the data. We assign this as the current value
                // of the 'searchData' reference, which means we won't try and load again.
                searchData.current = new SearchData(buffer);
                resolve();
              })
              .catch((err) => {
                // We couldn't convert the data to an 'ArrayBuffer'
                console.error(err);
                reject(err);
              });
          } else {
            // We were unable to load the data
            console.error("Failed to retrieve search data: " + response.statusText);
            reject(response.statusText);
          }
        })
        .catch((err) => {
          // We were unable to load the data
          console.error(err);
          reject(err);
        });
    });
  };

  // Convenience wrapper which will first load the search data (using 'loadSearchData') if we
  // do not already have the data loaded. If the data is not loaded, once loading has completed
  // it will set the 'visible' state to true. If the data is already loaded it will immediately
  // set the state to loaded.

  const loadAndSetVisible = () => {
    if (!searchData.current) {
      loadSearchData()
        .then(() => {
          console.log("Search data loaded; setting search box visible");
          setSearchVisible(true);
        })
        .catch((err) => {
          console.log("Search data could not be loaded; setting search box visible");
          setSearchVisible(true);
        });
    } else {
      setSearchVisible(true);
    }
  };

  // Handle our search hotkeys: S or Tab to open the search and Escape to close. We check to
  // ensure that the event did not bubble up to the window from an input, select or textarea.

  const onWindowKeyDown = (event) => {
    const tag = event.target.tagName;
    if ((tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") && event.key === "s") {
      return;
    }

    if (!event.repeat) {
      if (event.key === "Tab" || event.key === "s") {
        loadAndSetVisible();
        event.preventDefault();
      } else if (event.key === "Escape") {
        setSearchVisible(false);
        event.preventDefault();
      }
    }
  };

  // When we mount this component we want to add an event listener to the window for our
  // hotkeys; then when we unmount we want to remove the event listener.

  useEffect(() => {
    console.log("Adding window event listener for search hotkeys");
    window.addEventListener("keydown", onWindowKeyDown);

    return () => {
      console.log("Removing window event listener for search hotkeys");
      window.removeEventListener("keydown", onWindowKeyDown);
    };
  }, [false]);

  return (
    <React.Fragment>
      <Child
        {...childProps}
        searchVisible={searchVisible}
        searchData={searchData.current}
        setSearchVisible={(visible) => {
          if (visible) {
            loadAndSetVisible();
          } else {
            setSearchVisible(false);
          }
        }}
      />
    </React.Fragment>
  );
};

/**
 * The search dialog component
 *
 * This creates the search dialog and encapsulates the majority of it's inner workings. It
 * expects to receive a property called 'searchData' that is an instance of 'SearchData'.
 * Additionally, a property called 'searchSearchVisible' is expected that allows the search
 * dialog to be dismissed.
 */
const SearchDialog = (props) => {
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [highlight, setHighlight] = useState("");
  const [active, setActive] = useState(-1);
  const query = `?highlight=${highlight}`;

  const completeSearch = (term) => {
    // Sanitise the search input: we only care about letters really.
    let term_words = term
      .toLowerCase()
      .replace(/[^a-z\s]/g, "")
      .split(/\s+/);

    // If we have no search term, then there are no results
    if (term_words.length < 1 || (term_words.length === 1 && term_words[0].length < 1)) {
      setSearchResults([]);
      setHighlight("");
      return;
    }

    // We highlight the user's input, not the search term
    setHighlight(encodeURIComponent(term));

    // For each of the search terms, perform a search, recording the occurrences in our list
    var occurrences = [];
    term_words.forEach((word) => {
      props.searchData.trie
        .findString(word)
        .forEach((occurrence) => occurrences.push(occurrence));
    });

    // Gather up all the results (as posts), counting their relevance
    let post_results = {};
    occurrences.forEach((occ) => {
      if (occ.post in post_results) {
        post_results[occ.post].relevance += occ.count;
      } else {
        const post = props.searchData.posts[occ.post];
        post_results[occ.post] = {
          current: post.url === location.pathname,
          relevance: occ.count,
          post: post,
        };
      }
    });

    // Sort the search results by their relevance (number of occurrences)
    const sorted = Object.keys(post_results)
      .map((key) => post_results[key])
      .sort((a, b) => b.relevance - a.relevance);

    // Filter out the match for the current page, if any
    const current = sorted.find((result) => result.current);
    const remaining = current ? sorted.filter((result) => !result.current) : sorted;

    // Assign the index to all the results
    if (current) {
      current.index = 0;
      remaining.forEach((result, index) => {
        result.index = 1 + index;
      });
      remaining.unshift(current);
    } else {
      remaining.forEach((result, index) => {
        result.index = index;
      });
    }

    // Store the results and reset the current selection
    setSearchResults(remaining);
    setActive(-1);
  };

  const onSearchTermChanged = (event) => {
    setSearchTerm(event.target.value);
    completeSearch(event.target.value.trim());
  };

  const handleKeyDown = (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive(Math.min(active + 1, searchResults.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive(Math.max(0, active - 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (active !== -1) {
        props.setSearchVisible(false);
        navigate(searchResults[active].post.url + query);
      }
    }
  };

  var result = null;
  if (searchTerm.length == 0) {
    result = (
      <div className="row center">
        <div className="column center">Search for a word prefix.</div>
      </div>
    );
  } else if (searchResults.length == 0) {
    result = (
      <div className="row center" style={{ color: "#c7cf2f" }}>
        Sorry, nothing was found.
      </div>
    );
  } else {
    const SearchLink = ({ post, relevance, index }) => {
      return (
        <Link
          className={"row search-result" + (index === active ? " active" : "")}
          to={post.url + query}
          onClick={() => {
            props.setSearchVisible(false);
          }}>
          <div className="column">{post.title}</div>
          <div className="column">
            {relevance.toString()} match{relevance !== 1 ? "es" : ""}
          </div>
        </Link>
      );
    };

    const search_links = searchResults.map((result, index) => {
      const link = (
        <SearchLink
          key={index.toString()}
          post={result.post}
          relevance={result.relevance}
          index={result.index}
        />
      );

      if (result.current) {
        return (
          <div
            key={index.toString()}
            className={"current-page" + (searchResults.length > 1 ? " other-results" : "")}>
            {link}
          </div>
        );
      } else {
        return link;
      }
    });

    result = (
      <React.Fragment>
        {search_links}
        <div className="row center">
          <p>
            <b>
              {searchResults.length} post{searchResults.length !== 1 ? "s" : ""} match
            </b>
          </p>
        </div>
      </React.Fragment>
    );
  }

  return (
    <React.Fragment>
      <div className="row">
        <div className="column">Search Blog Posts and Pages</div>
        <div className="column hints">
          <span className="tag">Tab</span>/<span className="tag">S</span>
          to search,
          <span className="tag">Esc</span>
          to close
        </div>
      </div>
      <div className="row">
        <div className="column wide">
          <input
            id="search-input"
            type="search"
            placeholder="Type search term here ..."
            autoComplete="off"
            autoFocus
            spellCheck="false"
            value={searchTerm}
            onChange={onSearchTermChanged}
            onKeyDown={handleKeyDown}
          />
        </div>
      </div>
      {result}
    </React.Fragment>
  );
};

/**
 * Container for the search dialog
 *
 * This is the container for displaying the search interface. It expects to receive a number
 * of props, all of which are provided by the `SearchProvider` component. These props are:
 *
 * 1. The `visible` property, being a boolean indicating whether the search should be visible
 *    or not.
 * 2. A `searchData` property containing either a `SearchData` instance or `null`. If this is
 *    `null` and `visible` is true, then the search dialog will display a message indicating
 *    that searching is unavailable.
 * 3. A function property called `setSearchVisible` which takes a boolean argument and changes
 *    the search to be either visible or invisible depending on the argument. This is used to
 *    dismiss the search window when the container is clicked.
 */
export const SearchContainer = (props) => {
  const containerRef = useRef();

  const handleBackdropClick = (event) => {
    if (event.target === containerRef.current) {
      props.setSearchVisible(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className={"search-box-container " + (props.visible ? "" : "hidden")}
      onClick={handleBackdropClick}>
      {props.visible ? (
        <div className="search-box">
          {props.searchData ? (
            <SearchDialog {...props} />
          ) : (
            <div className="row center">
              <div className="column">
                <h1>Search is unavailable</h1>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};
