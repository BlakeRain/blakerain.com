from typing import Any, Callable, Dict, List, Optional, Set, Tuple

import io
import mistletoe
import mistletoe.block_token as B
import mistletoe.span_token as S
import os
import re
import struct
import yaml

STEM_WORDS = {
    'that', 'been', 'him', 'us', 'would', 'own', 'or', 'yourselves', 'new', 'no', 'such', 'below', 'did', 'if',
    'myself', 'against', 'do', 'because', 'am', 'back', 'his', 'to', 'what', 'people', 'make', 'who', 'but', 'on',
    'there', 'between', 'way', 'other', 'than', 'which', 'while', 'see', 'all', 'I', 'was', 'them', 'of', 'just',
    'good', 'she', 'whom', 'day', 'only', 'two', 'first', 'know', 'ourselves', 'come', 'he', 'from', 'why', 'few',
    'for', 'their', 'one', 'the', 'this', 'any', 'down', 'more', 'ours', 'we', 'think', 'will', 'about', 'above',
    'were', 'be', 'our', 'themselves', 'having', 'they', 'time', 'say', 'under', 'once', 'doing', 'further', 'yours',
    'look', 'with', 'want', 'in', 'how', 'like', 'has', 'had', 'give', 'by', 'it', 'during', 'nor', 't', 'a', 'could',
    'very', 'some', 'well', 'have', 'your', 'is', 'so', 'you', 'i', 'after', 'yourself', 'even', 'should', 'when',
    'himself', 'at', 'its', 'and', 'too', 'same', 'until', 'hers', 'as', 'don', 'most', 'also', 'herself', 'take',
    'again', 'before', 'these', 'through', 'both', 'theirs', 'use', 'her', 'those', 'where', 'year', 'being', 'does',
    'off', 'are', 's', 'over', 'here', 'me', 'go', 'into', 'each', 'work', 'up', 'an', 'itself', 'my', 'get', 'out',
    'can', 'then', 'not', 'now'
}


class MarkdownExtractor(mistletoe.BaseRenderer):
    def __init__(self):
        super().__init__()
        self.text: List[str] = []

    def render_raw_text(self, token: S.RawText):
        self.text.append(token.content)
        return ""

    def render_line_break(self, token: S.LineBreak):
        return ""


TEXT_WORD_RE = re.compile(r"[\w_][\w_-]{2,}")


def extract_content(source: List[str]) -> List[str]:
    markdown = mistletoe.Document(source)
    extractor = MarkdownExtractor()
    extractor.render(markdown)
    words = []
    for text in extractor.text:
        words.extend(TEXT_WORD_RE.findall(text))
    return [word for word in words if word not in STEM_WORDS]


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
            assert isinstance(n, int), f"Cannot store non-integral value: {n} ({type(n)})"
            assert n >= 0
            while n > 0x80:
                self.store("B", (n & 0x7f) | 0x80)
                n = n >> 7
            self.store("B", n & 0x7f)

    def write(self, fp):
        fp.write(self.buffer)


class SearchTermOccurrence:
    def __init__(self, post_id: int, count: int = 1):
        self.post: int = post_id
        self.count: int = count

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


def dot_key(key: int):
    if key == 0:
        return "root"
    if key == 34:
        return "\\\""
    if key == 92:
        return "\\\\"
    return chr(key)


class TrieNode:
    def __init__(self, key: int):
        self.key = key
        self.children: Dict[int, TrieNode] = {}
        self.occurrences: List[SearchTermOccurrence] = []

    @property
    def dot_label(self) -> str:
        return f"{dot_key(self.key)}"

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

    def dot(self) -> str:
        content = ["digraph {"]

        def visit(node: TrieNode):
            content.append(f"node{node.__hash__()}[label=\"{node.dot_label}\"];")
            for edge, child in node.children.items():
                visit(child)
                content.append(f"node{node.__hash__()} -> node{child.__hash__()} "
                               f"[label=\"{dot_key(edge)}\"];")

        visit(self.root)
        content.append("}")
        return "\n".join(content)


class SuffixNode:
    def __init__(self):
        self.children: Dict[int, SuffixNode] = {}
        self.suffix: Optional[SuffixNode] = None
        self.index: int = -1


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
        for term in self.terms.values():
            term_trie.insert_term(term)
        node_count = term_trie.encode(store)
        total_occ = sum([sum([occ.count for occ in term.occurrences]) for term in self.terms.values()])
        print("Total terms               : {}".format(len(self.terms)))
        print("Total occurrences         : {}".format(total_occ))
        print("Stored term trie nodes    : {}".format(node_count))
        print("Total search database size: {:.2f} Kb".format(len(store.buffer) / 1024.0))


def build_search() -> SearchData:
    search_data = SearchData()
    for resource in ["posts", "pages"]:
        for file in os.listdir(os.path.join("content", resource)):
            if file.endswith(".md"):
                path = os.path.join("content", resource, file)
                with open(path, "rt") as fp:
                    source = fp.readlines()
                post, content = split_frontmatter(path, source)
                search_data.add_post(resource == "pages", post, content)
    return search_data


if __name__ == "__main__":
    store = Store()
    search_data = build_search()
    search_data.encode(store)

    os.makedirs("public/data", exist_ok=True)
    with open("public/data/search.bin", "wb") as fp:
        store.write(fp)
