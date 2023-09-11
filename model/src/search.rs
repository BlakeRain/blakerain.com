use std::{
    cmp::Ordering,
    collections::{hash_map::Entry, HashMap, HashSet},
};

use serde::{
    de::{SeqAccess, Visitor},
    ser::SerializeSeq,
    Deserialize, Deserializer, Serialize, Serializer,
};

use crate::document::{DocId, RenderNode, TagName, TextNodeId};

use self::tokens::{tokenize_code, tokenize_phrasing, Token};

pub mod stop;
pub mod tokens;

/// The location of a search term
#[derive(Debug, Serialize, Deserialize)]
pub struct IndexLoc {
    /// The ID of the document
    pub document: DocId,
    /// The ID of the text node in the document
    pub node: TextNodeId,
}

pub type IndexLocId = usize;

/// A cache of index locations, corresponding a unique ID to a location.
#[derive(Debug, Default, Serialize, Deserialize)]
pub struct IndexLocations {
    locations: HashMap<IndexLocId, IndexLoc>,
}

impl IndexLocations {
    pub fn add(&mut self, document: DocId, node: TextNodeId) -> IndexLocId {
        let index = self.locations.len();
        self.locations.insert(index, IndexLoc { document, node });
        index
    }

    #[inline]
    pub fn get(&self, index: IndexLocId) -> Option<&IndexLoc> {
        self.locations.get(&index)
    }
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Range {
    pub start: usize,
    pub length: usize,
}

impl Range {
    pub fn merge(ranges: &mut Vec<Range>, from: Vec<Range>) {
        for from in from.into_iter() {
            let from_start = from.start;
            let from_end = from.start + from.length;

            let mut inserted = false;
            for index in 0..ranges.len() {
                let range_start = ranges[index].start;
                let range_end = range_start + ranges[index].length;

                if range_start < from_start {
                    continue;
                }

                if range_start > from_end {
                    inserted = true;
                    ranges.insert(index, from.clone());
                    break;
                }

                let range = &mut ranges[index];
                range.start = range_start.min(from_start);
                let end = range_end.max(from_end);
                range.length = end - range.start;
                inserted = true;
                break;
            }

            if !inserted {
                ranges.push(from);
            }
        }
    }
}

/// A node in the search tree
///
/// Each node in the seearch tree contains a set of zero or more children, where each child is
/// indexed by character. Each node also contains a mapping from a location ID to an array of one
/// or more ranges.
#[derive(Debug, Default, PartialEq)]
pub struct Node {
    pub fragment: String,
    pub children: HashMap<char, Node>,
    pub ranges: HashMap<IndexLocId, Vec<Range>>,
}

impl Node {
    pub fn new(fragment: String) -> Self {
        Self {
            fragment,
            children: HashMap::new(),
            ranges: HashMap::new(),
        }
    }

    pub fn add_range(&mut self, location: IndexLocId, position: Range) {
        if let Some(ranges) = self.ranges.get_mut(&location) {
            ranges.push(position);
        } else {
            self.ranges.insert(location, vec![position]);
        }
    }
}

#[derive(Serialize, Deserialize)]
struct SerializedNode(u64, String, HashMap<IndexLocId, Vec<Range>>);

impl SerializedNode {
    pub fn pack(
        key: char,
        Node {
            fragment,
            children,
            ranges,
        }: &Node,
    ) -> Self {
        let key = if children.is_empty() { 0x00 } else { 0x01 } | ((key as u64) << 1);
        Self(key, fragment.clone(), ranges.clone())
    }

    pub fn unpack(self) -> (char, bool, Node) {
        let Self(key, fragment, ranges) = self;
        let has_children = (key & 0x01) == 0x01;
        let key = char::from_u32((key >> 1) as u32).expect("valid char");

        (
            key,
            has_children,
            Node {
                fragment,
                children: HashMap::new(),
                ranges,
            },
        )
    }
}

#[derive(Debug, Default, PartialEq)]
struct Tree {
    root: Node,
}

impl Tree {
    pub fn new(root: Node) -> Self {
        Self { root }
    }

    pub fn insert(&mut self, text: &str, location: IndexLocId, position: Range) {
        let mut node = &mut self.root;
        let chars = text.chars().collect::<Vec<_>>();
        let mut index = 0;

        while index < chars.len() {
            let ch = chars[index];
            let remainder = String::from_iter(&chars[index..]);

            let next = match node.children.entry(ch) {
                Entry::Occupied(mut entry) => {
                    let (prefix, mid) = {
                        let child = entry.get_mut();

                        if child.fragment == remainder {
                            child.add_range(location, position);
                            return;
                        }

                        let prefix = common_prefix(&child.fragment, &remainder);
                        if prefix.len() < child.fragment.len() {
                            let remains = chars.len() - index;
                            match prefix.len().cmp(&remains) {
                                Ordering::Equal => {
                                    let mut mid = Node::new(remainder);
                                    mid.add_range(location, position.clone());
                                    (prefix, Some(mid))
                                }

                                Ordering::Less => {
                                    let mut mid = Node::new(prefix.clone());
                                    let tail_fragment =
                                        String::from_iter(&chars[index + prefix.len()..]);
                                    let mut tail = Node::new(tail_fragment);
                                    tail.add_range(location, position.clone());
                                    mid.children
                                        .insert(tail.fragment.chars().next().unwrap(), tail);
                                    (prefix, Some(mid))
                                }

                                Ordering::Greater => (prefix, None),
                            }
                        } else {
                            (prefix, None)
                        }
                    };

                    if let Some(mid) = mid {
                        // Replace the child with the new midpoint
                        let mut child = entry.insert(mid);

                        let mid = entry.get_mut();
                        let prev_frag = child.fragment.clone();
                        child.fragment = child.fragment.chars().skip(prefix.len()).collect();
                        mid.children
                            .insert(prev_frag.chars().nth(prefix.len()).unwrap(), child);
                        return;
                    }

                    let child = entry.get();
                    index += child.fragment.chars().count();
                    Some(ch)
                }

                Entry::Vacant(entry) => {
                    let mut child = Node::new(remainder);
                    child.add_range(location, position);
                    entry.insert(child);
                    return;
                }
            };

            if let Some(next) = next {
                node = node.children.get_mut(&next).unwrap();
            } else {
                return;
            }
        }
    }

    pub fn search(&self, prefix: &str) -> HashMap<IndexLocId, Vec<Range>> {
        let mut node = &self.root;
        let prefix = prefix.chars().collect::<Vec<_>>();
        let mut index = 0;

        while index < prefix.len() {
            let ch = prefix[index];

            if let Some(child) = node.children.get(&ch) {
                // Get the common prefix between the remainder of the prefix and the child's
                // fragment.
                let remainder = String::from_iter(&prefix[index..]);
                let common_prefix_len = common_prefix(&child.fragment, &remainder).chars().count();

                // If the common prefix doesn't match the fragment or what's left of the prefix,
                // this prefix cannot be found in the tree.

                if common_prefix_len != child.fragment.chars().count()
                    && common_prefix_len != prefix.len() - index
                {
                    return HashMap::default();
                }

                index += child.fragment.chars().count();
                node = child;
            } else {
                // No child exists with tihs character, so the prefix cannot be found in the tree.
                return HashMap::default();
            }
        }

        fn collect(found_ranges: &mut HashMap<IndexLocId, Vec<Range>>, node: &Node) {
            for (location, position) in &node.ranges {
                if let Some(ranges) = found_ranges.get_mut(location) {
                    ranges.append(&mut position.clone());
                } else {
                    found_ranges.insert(*location, position.clone());
                }
            }

            for child in node.children.values() {
                collect(found_ranges, child)
            }
        }

        let mut found_ranges: HashMap<IndexLocId, Vec<Range>> = HashMap::new();
        collect(&mut found_ranges, node);

        found_ranges
    }
}

impl Serialize for Tree {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        #[derive(Default)]
        struct NodeVisitorCounter {
            count: usize,
            depth: usize,
        }

        impl NodeVisitorCounter {
            fn retrace(&mut self) {
                if self.depth > 0 {
                    self.count += 1;
                    self.depth = 0;
                }
            }

            fn visit(mut self, node: &Node) -> Self {
                self.retrace();

                self.count += 1;
                for child in node.children.values() {
                    self = self.visit(child);
                }

                self.depth += 1;
                self
            }

            fn end(mut self) -> usize {
                self.retrace();
                self.count
            }
        }

        struct NodeVisitor<S: Serializer> {
            serializer: <S as Serializer>::SerializeSeq,
            stack_depth: usize,
        }

        impl<S: Serializer> NodeVisitor<S> {
            fn retrace(&mut self) -> Result<(), S::Error> {
                if self.stack_depth > 0 {
                    self.serializer.serialize_element(&self.stack_depth)?;
                    self.stack_depth = 0;
                }

                Ok(())
            }

            fn visit(&mut self, key: char, node: &Node) -> Result<(), S::Error> {
                // Retrace our steps back to the parent node
                self.retrace()?;

                // Store the tree node, and if the node has children, recursively store those aswell.
                let packed = SerializedNode::pack(key, node);
                self.serializer.serialize_element(&packed)?;

                for (child_key, child) in &node.children {
                    self.visit(*child_key, child)?;
                }

                // We have finished this node, so increment our stack depth
                self.stack_depth += 1;
                Ok(())
            }

            fn end(mut self) -> Result<S::Ok, S::Error> {
                self.retrace()?;
                self.serializer.end()
            }
        }

        let length = NodeVisitorCounter::default().visit(&self.root).end();
        let mut visitor: NodeVisitor<S> = NodeVisitor {
            serializer: serializer.serialize_seq(Some(length))?,
            stack_depth: 0,
        };

        visitor.visit('\0', &self.root)?;
        visitor.end()
    }
}

impl<'de> Deserialize<'de> for Tree {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        struct NodeVisitor;

        impl<'de> Visitor<'de> for NodeVisitor {
            type Value = Node;

            fn expecting(&self, formatter: &mut std::fmt::Formatter) -> std::fmt::Result {
                formatter.write_str("struct Tree")
            }

            fn visit_seq<V>(self, mut seq: V) -> Result<Node, V::Error>
            where
                V: SeqAccess<'de>,
            {
                let mut n = 0;
                let mut stack = Vec::new();
                let mut root = None;

                loop {
                    // Decode the tree node from the data
                    let (key, has_children, node) = seq
                        .next_element::<SerializedNode>()?
                        .ok_or_else(|| serde::de::Error::invalid_length(n, &self))?
                        .unpack();

                    n += 1;
                    stack.push((key, node));

                    if !has_children {
                        // This was a leaf node (no children), so we want to pop the stack to get
                        // to the parent node. The number of nodes to pop is encoded in the stream.
                        let mut pop: usize = seq
                            .next_element()?
                            .ok_or_else(|| serde::de::Error::invalid_length(n, &self))?;
                        n += 1;

                        while pop > 0 {
                            if let Some((node_key, node)) = stack.pop() {
                                if let Some((_, parent)) = stack.last_mut() {
                                    parent.children.insert(node_key, node);
                                } else {
                                    root = Some(node);
                                }
                            } else {
                                return Err(serde::de::Error::custom("excessive pop instructions"));
                            }

                            pop -= 1;
                        }

                        // If we came to the end of the stack, then we've finished decoding.
                        if stack.is_empty() {
                            break;
                        }
                    }
                }

                if let Some(root) = root {
                    Ok(root)
                } else {
                    Err(serde::de::Error::custom("no root node found"))
                }
            }
        }

        let root = deserializer.deserialize_seq(NodeVisitor)?;
        Ok(Self::new(root))
    }
}

fn common_prefix(left: &str, right: &str) -> String {
    let mut prefix = String::new();

    for (left, right) in left.chars().zip(right.chars()) {
        if left == right {
            prefix.push(left);
        } else {
            break;
        }
    }

    prefix
}

pub struct SearchPosition {
    location: IndexLocId,
    ranges: Vec<Range>,
}

impl SearchPosition {
    fn merge(positions: &mut Vec<SearchPosition>, input: Vec<SearchPosition>) {
        for input in input {
            let mut found = false;
            for existing in &mut *positions {
                if existing.location == input.location {
                    Range::merge(&mut existing.ranges, input.ranges.clone());
                    found = true;
                    break;
                }
            }

            if !found {
                positions.push(input);
            }
        }

        positions.sort_by_key(|position| position.location);
    }
}

#[derive(Debug, Default, Serialize)]
pub struct Index {
    locations: IndexLocations,
    tree: Tree,
}

impl Index {
    pub fn add_document(&mut self, id: DocId, nodes: &Vec<RenderNode>) {
        for node in nodes {
            self.add_node(id, false, node)
        }
    }

    pub fn add_node(&mut self, id: DocId, code: bool, node: &RenderNode) {
        match node {
            RenderNode::Text(text) => {
                let tokens = if code {
                    tokenize_code(&text.content)
                } else {
                    tokenize_phrasing(&text.content)
                };

                if tokens.is_empty() {
                    return;
                }

                let location = self.locations.add(id, text.id);
                for Token {
                    text,
                    start,
                    length,
                } in tokens
                {
                    self.tree.insert(&text, location, Range { start, length })
                }
            }

            RenderNode::Element(element) => {
                for child in &element.children {
                    self.add_node(
                        id,
                        if element.tag == TagName::Code {
                            true
                        } else {
                            code
                        },
                        child,
                    )
                }
            }

            RenderNode::Icon(_) => {}
        }
    }

    pub fn search(&self, input: &str, id: Option<DocId>) -> HashMap<DocId, Vec<SearchPosition>> {
        let tokens = tokenize_phrasing(input);
        if tokens.is_empty() {
            return HashMap::default();
        }

        let matches = tokens
            .into_iter()
            .map(|token| self.search_term(&token.text, id))
            .collect::<Vec<_>>();

        let mut combined_ids: Option<HashSet<DocId>> = None;
        for tok_match in &matches {
            let tok_match_ids = tok_match.keys().copied().collect::<HashSet<_>>();
            combined_ids = if let Some(combined_ids) = combined_ids {
                Some(combined_ids.intersection(&tok_match_ids).copied().collect())
            } else {
                Some(tok_match_ids)
            };
        }

        let combined_ids = combined_ids.unwrap_or_default();
        if combined_ids.is_empty() {
            return HashMap::new();
        }

        let mut combined = HashMap::new();
        for tok_match in matches {
            for (doc_id, positions) in tok_match {
                if !combined_ids.contains(&doc_id) {
                    continue;
                }

                if let Some(current) = combined.get_mut(&doc_id) {
                    SearchPosition::merge(current, positions);
                } else {
                    combined.insert(doc_id, positions);
                }
            }
        }

        combined
    }

    fn search_term(&self, prefix: &str, id: Option<DocId>) -> HashMap<DocId, Vec<SearchPosition>> {
        let found_locations = self.tree.search(prefix);

        let mut results: HashMap<DocId, Vec<SearchPosition>> = HashMap::new();
        for (location, ranges) in found_locations.into_iter() {
            let loc = self.locations.get(location).expect("valid location ID");

            if let Some(id) = id {
                if loc.document != id {
                    continue;
                }
            }

            let position = SearchPosition { location, ranges };
            if let Some(result) = results.get_mut(&loc.document) {
                result.push(position);
            } else {
                results.insert(loc.document, vec![position]);
            }
        }

        results
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_tree_prefix() {
        let mut tree = Tree::default();

        tree.insert(
            "test",
            0,
            Range {
                start: 0,
                length: 4,
            },
        );

        tree.insert(
            "testing",
            1,
            Range {
                start: 10,
                length: 7,
            },
        );

        tree.insert(
            "tested",
            2,
            Range {
                start: 20,
                length: 6,
            },
        );

        let d = postcard::to_stdvec(&tree).expect("encoding to work");
        let t: Tree = postcard::from_bytes(&d).expect("decoding to work");

        assert_eq!(tree, t);
    }
}
