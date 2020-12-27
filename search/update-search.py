from typing import Any, Dict, List

import bs4
import os
import re
import requests
import struct


def extract_content(source):
    soup = bs4.BeautifulSoup(source, features="html.parser")
    for script in soup(["script", "style"]):
        script.extract()
    return soup.get_text()


class SearchOutput:
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

    def encode(self, output: SearchOutput):
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

    def encode(self, output: SearchOutput):
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

    def encode(self, output: SearchOutput):
        output.store(">B", self.key)
        output.store7(len(self.occurrences), len(self.children))
        for occurrence in self.occurrences:
            occurrence.encode(output)
        for child_key in self.children:
            self.children[child_key].encode(output)


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

    def encode(self, output: SearchOutput):
        self.root.encode(output)


class SearchData:
    def __init__(self):
        self.posts: Dict[int, SearchPost] = {}
        self.terms: Dict[str, SearchTerm] = {}

    def get_term(self, text: str) -> SearchTerm:
        text = text.strip().lower()
        text = re.sub(r"[^a-z0-9\\/-]", '', text)
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
        for text in data["content"].split(" "):
            term = self.get_term(text)
            if term is not None:
                term.add_occurrence(post)

    def encode(self, output: SearchOutput):
        output.store7(len(self.posts))
        for post_id in self.posts:
            post = self.posts[post_id]
            post.encode(output)
        term_trie = Trie()
        for term_text in self.terms:
            term = self.terms[term_text]
            term_trie.insert_term(term)
        term_trie.encode(output)


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

search_data = SearchData()

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
            search_data.add_post(post)
        if data["meta"]["pagination"]["pages"] <= page:
            print(f"  This is the last page")
            break
        page += 1

output = SearchOutput()
search_data.encode(output)
with open("search.bin", "wb") as fp:
    output.write(fp)
