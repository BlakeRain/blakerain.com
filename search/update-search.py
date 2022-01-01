from typing import Any, Dict, List, Optional, Tuple

import io
import mistletoe
import mistletoe.block_token as B
import mistletoe.span_token as S
import os
import re
import struct
import yaml


class MarkdownExtractor(mistletoe.BaseRenderer):
    def __init__(self):
        super().__init__()
        self.text: List[str] = []

    def render_raw_text(self, token: S.RawText):
        self.text.append(token.content)
        return ""


TEXT_WORD_RE = re.compile(r"\S[\S-]{2,}")


def extract_content(source: List[str]) -> List[str]:
    markdown = mistletoe.Document(source)
    extractor = MarkdownExtractor()
    extractor.render(markdown)
    words = []
    for text in extractor.text:
        words.extend(TEXT_WORD_RE.findall(text))
    return words


def split_frontmatter(file_path: str, lines: List[str]) -> Tuple[Dict[str, Any], List[str]]:
    front_matter = {}
    if len(lines) > 2 and lines[0].strip() == "---":
        lines = lines[1:]
        fm_source = []
        for line in lines:
            if line.strip() == "---":
                break
            fm_source.append(line)
        lines = lines[1 + len(fm_source):]
        stream = io.StringIO('\n'.join(fm_source))
        stream.__setattr__("name", file_path)
        front_matter = yaml.load(stream, Loader=yaml.SafeLoader)
    return front_matter, lines


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
    def __init__(self, is_page: bool, id: int, title: str, url: str):
        self.is_page: bool = is_page
        self.id: int = id
        self.title: str = title
        self.url: str = url

    def encode(self, output: Store):
        title_enc = self.title.encode("utf-8")
        url_enc = self.url.encode("utf-8")
        output.store7((self.id << 1) | (
            0x01 if self.is_page else 0x00), len(title_enc))
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

    def get_term(self, text: str) -> Optional[SearchTerm]:
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

    def add_post(self, is_page, data: Dict[str, Any], content: List[str]):
        post = SearchPost(is_page, len(self.posts),
                          data["title"], data["slug"])
        self.posts[post.id] = post
        words = extract_content(content)
        for word in words:
            term = self.get_term(word)
            if term is not None:
                term.add_occurrence(post)

    def encode(self, store: Store):
        store.store(">I", 0x53524348)
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


SEARCH_DATA = SearchData()

for resource in ["posts", "pages"]:
    for file in os.listdir(os.path.join("content", resource)):
        if file.endswith(".md"):
            path = os.path.join("content", resource, file)
            with open(path, "rt") as fp:
                source = fp.readlines()
            post, content = split_frontmatter(path, source)
            SEARCH_DATA.add_post(resource == "pages", post, content)

STORE = Store()
SEARCH_DATA.encode(STORE)

os.makedirs("public/data", exist_ok=True)
with open("public/data/search.bin", "wb") as fp:
    STORE.write(fp)
