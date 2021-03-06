const STATE = { OPEN: 1, CLOSED: 0 };

class Decoder {
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

class Occurrence {
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

  get_word() {
    let output = [];
    var node = this;

    while (node !== null) {
      if (node.key != 0) {
        output.unshift(String.fromCharCode(node.key));
      }

      node = node.parent;
    }

    return output.join("");
  }

  decode(decoder, stats) {
    const key = decoder.decode7();

    this.key = key >> 2;

    if (key & 0x02) {
      let noccurrences = decoder.decode7();
      for (let i = 0; i < noccurrences; ++i) {
        this.occurrences.push(new Occurrence(decoder));
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
    this.root = Trie.decode_trie(decoder, stats);
  }

  find_string(prefix) {
    var node = this.root;

    for (var i = 0; i < prefix.length; ++i) {
      let ch = prefix.charCodeAt(i);

      if (node.children[ch]) {
        node = node.children[ch];
      } else {
        return [];
      }
    }

    return this.find_occurrences(node, []);
  }

  find_occurrences(node, output) {
    if (node.occurrences.length > 0) {
      output = output.concat(node.occurrences);
    }

    for (var child in node.children) {
      output = this.find_occurrences(node.children[child], output);
    }

    return output;
  }

  static decode_trie(decoder, stats) {
    let stack = [];
    let root = null;

    for (;;) {
      // Create the node and decode it. The decode method will indicate whether we should expect
      // another node to immediately follow, or if this was a leaf node.
      let parent = stack.length > 0 ? stack[stack.length - 1] : null;
      let node = new TrieNode(0, parent);
      let has_children = node.decode(decoder, stats);

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

        // If we came to the end of the stack, then we're done
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

class SearchData {
  constructor(encoded) {
    let t0 = performance.now();
    let decoder = new Decoder(encoded);
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
      "Decoded " +
        num_posts +
        " posts, " +
        term_stats.count +
        " term trie nodes in " +
        (t1 - t0) +
        " milliseconds from " +
        (encoded.byteLength / 1024.0).toFixed(2) +
        " Kb"
    );
  }
}

class SearchStore {
  get isOpen() {
    return this._state == STATE.OPEN;
  }

  get data() {
    return this._search_data;
  }

  get term() {
    return this._term;
  }

  get highlight() {
    return this._highlight;
  }

  get results() {
    return this._search_results;
  }

  constructor() {
    this._search_data = null;
    this._state = STATE.CLOSED;
    this._term = "";
    this._highlight = "";
    this._timer = null;
    this._search_results = [];

    this.onStateChangedHandlers = [];
    this.onSearchChangedHandlers = [];

    window.addEventListener("keydown", (event) => {
      if (!event.repeat) {
        if (event.key == "Tab" || event.key == "s") {
          if (this._state == STATE.CLOSED) {
            this.open();
            event.stopPropagation();
            event.preventDefault();
          }
        } else if (event.key == "Escape" && this._state == STATE.OPEN) {
          this.close();
          event.stopPropagation();
          event.preventDefault();
        }
      }
    });
  }

  load() {
    return new Promise((resolve, reject) => {
      if (!this._search_data) {
        fetch("https://s3-eu-west-1.amazonaws.com/s3.blakerain.com/data/search.bin", {
          method: "GET",
          cache: "no-cache",
        }).then((response) => {
          if (response.ok) {
            response
              .arrayBuffer()
              .then((buffer) => {
                this._search_data = new SearchData(buffer);
                resolve();
              })
              .catch((err) => {
                console.error(err);
                reject(err);
              });
          } else {
            console.error(response.statusText);
            reject(err);
          }
        });
      } else {
        resolve();
      }
    });
  }

  open() {
    if (this._state == STATE.CLOSED) {
      this.load().then(() => {
        this._state = STATE.OPEN;
        this.onStateChanged();
      });
    }
  }

  close() {
    this._state = STATE.CLOSED;
    this.onStateChanged();
  }

  setTerm(term) {
    this._term = term;
    this.onSearchChanged();

    if (this._timer) {
      window.clearTimeout(this._timer);
    }

    this._timer = window.setTimeout(() => this.completeSearch(), 10);
  }

  noSearchResults() {
    this._search_results = [];
    this._highlight = "";
    this.onSearchChanged();
  }

  completeSearch() {
    if (this._timer) {
      window.clearTimeout(this._timer);
      this._timer = null;
    }

    let term = this._term.trim();
    var occurrences = [];
    let term_words = term
      .toLowerCase()
      .replace(/[^a-z\s]/g, "")
      .split(/\s+/);

    if (term_words.length < 1 || (term_words.length == 1 && term_words[0].length < 1)) {
      this.noSearchResults();
      return;
    }

    this._highlight = term_words.map((word) => encodeURIComponent(word)).join("+");
    term_words.forEach((word) => {
      this._search_data.trie
        .find_string(word)
        .forEach((occurrence) => occurrences.push(occurrence));
    });

    let post_results = {};
    occurrences.forEach((occ) => {
      if (occ.post in post_results) {
        post_results[occ.post].relevance += occ.count;
      } else {
        post_results[occ.post] = {
          relevance: occ.count,
          post: this._search_data.posts[occ.post],
        };
      }
    });

    this._search_results = Object.keys(post_results)
      .map((key) => post_results[key])
      .sort((a, b) => b.relevance - a.relevance);

    this.onSearchChanged();
  }

  onStateChanged() {
    this.onStateChangedHandlers.forEach((handler) => handler());
  }

  onSearchChanged() {
    this.onSearchChangedHandlers.forEach((handler) => handler());
  }
}

class SearchView {
  constructor(store) {
    this.store = store;
    this.container = document.querySelector(".search-box-container");
    this.input = document.getElementById("search-input");
    this.hint = document.getElementById("search-hint");
    this.empty = document.getElementById("search-empty");
    this.summary = document.getElementById("search-summary");
    this.results = document.getElementById("search-results");
    this.count = document.getElementById("search-results-count");
    this.limit = document.getElementById("search-results-limit");

    this.container.addEventListener("click", () => {
      this.store.close();
    });

    document.querySelector(".search-box").addEventListener("click", (event) => {
      event.stopPropagation();
    });

    this.input.addEventListener("input", (event) => {
      this.store.setTerm(this.input.value);
    });

    this.store.onStateChangedHandlers.push(() => {
      if (this.store.isOpen) {
        this.container.style.display = "flex";
        this.input.select();
        this.input.focus();
      } else {
        this.container.style.display = "none";
      }
    });

    this.store.onSearchChangedHandlers.push(() => {
      this.update();
    });
  }

  update() {
    if (this.store.term.length === 0) {
      this.hint.style.display = "flex";
      this.empty.style.display = "none";
      this.summary.style.display = "none";
      this.results.style.display = "none";
    } else if (this.store.results.length === 0) {
      this.hint.style.display = "none";
      this.empty.style.display = "flex";
      this.summary.style.display = "none";
      this.results.style.display = "none";
    } else {
      this.hint.style.display = "none";
      this.empty.style.display = "none";
      this.summary.style.display = "flex";
      this.results.style.display = "block";
      this.count.innerText =
        this.store.results.length.toString() +
        " post" +
        (this.store.results.length != 1 ? "s" : "") +
        " match";

      if (this.store.results.length > 5) {
        this.limit.style.display = "block";
      } else {
        this.limit.style.display = "none";
      }

      while (this.results.firstChild) {
        this.results.removeChild(this.results.lastChild);
      }

      let query = "?highlight=" + this.store.highlight;
      this.store.results.forEach((result) => {
        let link = document.createElement("A");
        link.href = result.post.url + query;
        link.className = "row search-result";

        let title = document.createElement("DIV");
        title.className = "column";
        title.innerText = result.post.title;
        link.appendChild(title);

        let matches = document.createElement("DIV");
        matches.className = "column";
        matches.innerText =
          result.relevance.toString() + " match" + (result.relevance != 1 ? "es" : "");
        link.appendChild(matches);

        this.results.appendChild(link);
      });
    }
  }
}

window.addEventListener("load", () => {
  let store = new SearchStore();
  let view = new SearchView(store);
  view.update();

  window["__searchStore"] = store;
});
