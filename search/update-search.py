from typing import Any, Dict, List
from html.parser import HTMLParser

import os
import re
import requests
import struct


class ExtractorParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.stack: List[str] = []
        self.current: str = None
        self.text: List[str] = []
        self.code: List[str] = []

    def handle_starttag(self, tag, attrs):
        if tag in ["img", "br"]:
            return
        if self.current:
            self.stack.append(self.current)
        self.current = tag

    def handle_endtag(self, tag):
        assert tag == self.current, f"Expected end of '{self.current}', but found '{tag}'"
        if len(self.stack) > 0:
            self.current = self.stack.pop()
        else:
            self.current = None

    def handle_data(self, data):
        if self.current == "code":
            self.code.append(data)
        elif self.current in ["emphasis", "strong", "a", "p", "li", "h1", "h2", "h3", "h4", "h5", "h6"]:
            self.text.append(data)


TEXT_WORD_RE = re.compile(r"\w[\w-]{2,}")
CODE_WORD_RE = re.compile(r"\w[\w_]{2,}")


def extract_content(source):
    extractor = ExtractorParser()
    extractor.feed(source)
    words = []
    for text in extractor.text:
        words.extend(TEXT_WORD_RE.findall(text))
    for code in extractor.code:
        words.extend(CODE_WORD_RE.findall(code))
    return words


class Store:
    def __init__(self):
        self.offset: int = 0
        self.buffer: bytes = bytes()

    def store(self, format, *args):
        len = struct.calcsize(format)
        buf = bytearray(len)
        struct.pack_into(format, buf, 0, *args)
        self.buffer += buf
        self.offset += len

    def store7(self, *args):
        for n in args:
            assert isinstance(n, int)
            assert n >= 0
            while n > 0x80:
                self.store("B", (n & 0x7f) | 0x80)
                n = n >> 7
            self.store("B", n & 0x7f)

    def write(self, fp):
        fp.write(self.buffer)


class SearchTermOccurrence:
    def __init__(self, post_id: int):
        self.post: int = post_id
        self.count: int = 1

    def encode(self, output: Store):
        output.store7(self.post, self.count)


class SearchTerm:
    def __init__(self, term: str):
        self.term: str = term
        self.occurrences: List[SearchTermOccurrence] = []

    def add_occurrence(self, post):
        assert isinstance(post, SearchPost)
        for occurrence in self.occurrences:
            if occurrence.post == post.id:
                occurrence.count += 1
                return
        self.occurrences.append(SearchTermOccurrence(post.id))


class SearchPost:
    def __init__(self, id: int, title: str, url: str):
        self.id: int = id
        self.title: str = title
        self.url: str = url

    def encode(self, output: Store):
        title_enc = self.title.encode("utf-8")
        url_enc = self.url.encode("utf-8")
        output.store7(self.id, len(title_enc))
        output.store(f">{len(title_enc)}s", title_enc)
        output.store7(len(url_enc))
        output.store(f">{len(url_enc)}s", url_enc)


class TrieNode:
    def __init__(self, key: int):
        self.key: int = key
        self.children: Dict[int, TrieNode] = {}
        self.occurrences: List[SearchTermOccurrence] = []

    def visit(self, visitor):
        visitor.enter_node(self)
        for child_key in self.children:
            self.children[child_key].visit(visitor)
        visitor.leave_node(self)


class TrieStoreVisitor:
    def __init__(self, store: Store):
        self.store: Store = store
        self.leave_count: int = 0
        self.node_count: int = 0

    def enter_node(self, node: TrieNode):
        self.node_count += 1
        self.finish()
        key = node.key << 2
        if node.children:
            key = key | 0x01
        if node.occurrences:
            key = key | 0x02
        self.store.store7(key)
        if node.occurrences:
            self.store.store7(len(node.occurrences))
            for occurrence in node.occurrences:
                occurrence.encode(self.store)

    def leave_node(self, node: TrieNode):
        self.leave_count += 1

    def finish(self):
        if self.leave_count > 0:
            self.store.store7(self.leave_count)
            self.leave_count = 0


class Trie:
    def __init__(self):
        self.root = TrieNode(0)

    def insert_term(self, term: SearchTerm):
        node = self.root
        for ch in [ord(ch) for ch in term.term]:
            if ch not in node.children:
                node.children[ch] = TrieNode(ch)
            node = node.children[ch]
        node.occurrences = term.occurrences

    def encode(self, store: Store) -> int:
        visitor = TrieStoreVisitor(store)
        self.root.visit(visitor)
        visitor.finish()
        return visitor.node_count


class SearchData:
    def __init__(self):
        self.stop_words: List[str] = []
        self.posts: Dict[int, SearchPost] = {}
        self.terms: Dict[str, SearchTerm] = {}
        if os.path.exists("stop-words"):
            with open("stop-words", "rt") as fp:
                for word in fp.readlines():
                    word = word.strip()
                    if len(word) > 0 and not word.startswith("#"):
                        self.stop_words.append(word)
                print(f"Loaded {len(self.stop_words)} stop words")

    def get_term(self, text: str) -> SearchTerm:
        text = text.strip().lower()
        if text in self.stop_words:
            return None
        if len(text) < 3 or len(text) > 20:
            return None
        if text in self.terms:
            return self.terms[text]
        term = SearchTerm(text)
        self.terms[text] = term
        return term

    def add_post(self, data):
        post = SearchPost(len(self.posts), data["title"], data["url"])
        self.posts[post.id] = post
        words = extract_content(data["html"])
        for word in words:
            term = self.get_term(word)
            if term is not None:
                term.add_occurrence(post)

    def encode(self, store: Store):
        store.store7(len(self.posts))
        for post_id in self.posts:
            post = self.posts[post_id]
            post.encode(store)
        term_trie = Trie()
        for term_text in self.terms:
            term = self.terms[term_text]
            term_trie.insert_term(term)
        node_count = term_trie.encode(store)
        print(f"Stored {len(self.terms)} terms in {node_count} trie nodes")
        print(f"Total search database: {len(store.buffer)} bytes")


DOMAIN = os.environ.get("DOMAIN", "blakerain.com")
API_KEY = os.environ.get("API_KEY")
URL_BASE = f"https://{DOMAIN}/ghost/api/v2/content/"

PARAMS = {
    "key": API_KEY,
    "fields": "id,title,html,url",
    "include": "tags",
    "page": 1
}

TAG_MATCHER = {
    "posts": lambda post: True,
    "pages": lambda page: "#searchable" in [tag["name"] for tag in page["tags"]]
}

SEARCH_DATA = SearchData()

for resource in ["posts", "pages"]:
    page = 1
    while True:
        print(
            f"Fetching page of {resource} from Ghost content API (page {page})")
        PARAMS["page"] = page
        r = requests.get(url=URL_BASE + resource, params=PARAMS)
        if r.status_code != 200:
            print(f"  Failed to fetch results: {r.status_code}")
            break
        data = r.json()
        for post in data[resource]:
            print(
                f"  Found {resource} {post['id']}: {post['title']} ({post['url']})")
            if not TAG_MATCHER[resource](post):
                print(f"    Does not match required tags")
                continue
            content = extract_content(post["html"])
            post["content"] = content
            SEARCH_DATA.add_post(post)
        if data["meta"]["pagination"]["pages"] <= page:
            print(f"  This is the last page")
            break
        page += 1

STORE = Store()
SEARCH_DATA.encode(STORE)
with open("search.bin", "wb") as fp:
    STORE.write(fp)
