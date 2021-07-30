import React, { useState } from "react";

class SearchDecoder {
  constructor(buffer) {
    this.buffer = buffer;
    this.offset = 0;
    this.view = new DataView(this.buffer);
  }

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

  decodeUtf8() {
    const len = this.decode7();
    const str = new TextDecoder("utf-8").decode(new DataView(this.buffer, this.offset, len));
    this.offset += len;
    return str;
  }
}

class SearchOccurrence {
  constructor(decoder) {
    this.post = decoder.decode7();
    this.count = decoder.decode7();
  }
}

class TrieNode {
  constructor(key, parent) {
    this.key = key;
    this.parent = parent || null;
    this.children = {};
    this.occurrences = [];
  }

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

  decode(decoder, stats) {
    const key = decoder.decode7();

    // The lower two bits of the key are flag bits
    this.key = key >> 2;

    if (key & 0x02) {
      const noccurrences = decoder.decode7();
      for (let i = 0; i < noccurrences; ++i) {
        this.occurrences.push(new SearchOccurrence(decoder));
      }
    }

    stats.count++;
    return (key & 0x01) == 0x01;
  }
}

class Trie {
  constructor() {
    this.root = null;
  }

  decode(decoder, stats) {
    this.root = Trie.decodeTrie(decoder, stats);
  }

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

  findOccurrences(node, output) {
    if (node.occurrences.length > 0) {
      output = output.concat(node.occurrences);
    }

    for (var child in node.children) {
      output = this.findOccurrences(node.children[child], output);
    }

    return output;
  }

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

class SearchPost {
  constructor(decoder) {
    this.id = decoder.decode7();
    this.title = decoder.decodeUtf8();
    this.url = decoder.decodeUtf8();
  }
}

export class SearchData {
  constructor(encoded) {
    let t0 = performance.now();
    let decoder = new SearchDecoder(encoded);
    let num_posts = decoder.decode7();

    this.posts = {};
    for (let i = 0; i < num_posts; ++i) {
      let post = new SearchPost(decoder);
      this.posts[post.id] = post;
    }

    let term_stats = { count: 0 };
    this.trie = new Trie();
    this.trie.decode(decoder, term_stats);

    let t1 = performance.now();
    console.log(
      `Decoded ${num_posts} posts, ${term_stats.count} term trie nodes in ${
        t1 - t0
      } milliseconds from ${(encoded.byteLength / 1024.0).toFixed(2)} Kb`
    );
  }
}

export const SearchDialog = (props) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchTimer, setSearchTimer] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [highlight, setHighlight] = useState("");

  function completeSearch() {
    if (searchTimer) {
      window.clearTimeout(searchTimer);
      setSearchTimer(null);
    }

    let term = searchTerm.trim();
    var occurrences = [];
    let term_words = term
      .toLowerCase()
      .replace(/[^a-z\s]/g, "")
      .split(/\s+/);

    if (term_words.length < 1 || (term_words.length === 1 && term_words[0].length < 1)) {
      setSearchResults([]);
      setHighlight("");
      return;
    }

    setHighlight(term_words.map((word) => encodeURIComponent(word)).join("+"));
    term_words.forEach((word) => {
      props.searchData.trie
        .findString(word)
        .forEach((occurrence) => occurrences.push(occurrence));
    });

    let post_results = {};
    occurrences.forEach((occ) => {
      if (occ.post in post_results) {
        post_results[occ.post].relevance += occ.count;
      } else {
        post_results[occ.post] = {
          relevance: occ.count,
          post: props.searchData.posts[occ.post],
        };
      }
    });

    setSearchResults(
      Object.keys(post_results)
        .map((key) => post_results[key])
        .sort((a, b) => b.relevance - a.relevance)
    );
  }

  function onSearchTermChanged(event) {
    setSearchTerm(event.target.value);

    if (searchTimer) {
      window.clearTimeout(searchTimer);
    }

    setSearchTimer(
      window.setTimeout(() => {
        completeSearch();
      }, 10)
    );
  }

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
    const query = `?highlight=${highlight}`;

    result = (
      <React.Fragment>
        {searchResults.map((result, index) => (
          <a
            key={index.toString()}
            className="row search-result"
            href={result.post.url + query}>
            <div className="column">{result.post.title}</div>
            <div className="column">
              {result.relevance.toString()} match{result.relevance !== 1 ? "es" : ""}
            </div>
          </a>
        ))}
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
    <div
      className={"search-box-container " + (props.visible ? "" : "hidden")}
      onClick={() => props.setSearchVisible(false)}>
      <div className="search-box">
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
              autoFocus="yes"
              spellCheck="false"
              value={searchTerm}
              onChange={onSearchTermChanged}
            />
          </div>
        </div>
        {result}
      </div>
    </div>
  );
};
