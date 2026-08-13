---
title: Stack Retrace for Graph Storage
date: 2026-08-11T14:33:00.000Z
tags:
  - rust
---

```rust
pub struct Node<K, V> {
    value: V,
    children: BTreeMap<K, Node<K, V>>,
}
```

> [!NOTE] The use of `BTreeMap` rather than `HashMap`
> We're using a `BTreeMap` here, rather than a `HashMap`, because we want to preserve the order of
> the keys in the map. This is only relevant so that the order of the nodes in our graph-walking is
> predictable.

```rust
pub trait Writable {
    fn write<W: Write>(&self, write: &mut W) -> std::io::Result<()>;
}
```

# Normal Recursive Storage

Normally --- if we were sane people --- we would store our graph by walking over each node, writing
out the node's value followed by the children. Each serialised node would include the number of
children, followed by the data for those children. Such a recursive function might look something
like this:

```rust
impl<K, V> Node<K, V>
where
    K: Writable,
    V: Writable,
{
    fn write_recursive<W: std::io::Write>(&self, writer: &mut W) -> std::io::Result<()> {
        self.value.write(writer)?;

        writer.write_u32::<BigEndian>(self.children.len() as u32)?;
        for (key, child) in &self.children {
            key.write(writer)?;
            child.write_recursive(writer)?;
        }

        Ok(())
    }
}
```

This recursive approach has the effect of making us jump all the way down the leaves of our test
tree: from `A` to `B`, to `D` and finally to `F`, then work our way along from `F` to `G` to `H`,
and finally back up the tree, finishing off with `E` and then finally `C`. The path we take through
the tree can be visualised as follows:

{{< figure
    schemed="true"
    src="diagrams/recursive-storage.svg"
    caption="Recursive walk through our sample graph" >}}

The green arrows represents visiting a child node by calling the `write()` method, and the red
arrows represent returning from that function call to the parent node.

Storing data this way, our little test tree encodes into a block of 47 bytes, with the following
rather straightforward contents:

```
Length: 47 (0x2f) bytes
0000:   41 00 00 00  02 62 42 00  00 00 02 64  44 00 00 00   A....bB....dD...
0010:   03 66 46 00  00 00 00 67  47 00 00 00  00 68 48 00   .fF....gG....hH.
0020:   00 00 00 65  45 00 00 00  00 63 43 00  00 00 00      ...eE....cC....
```

Reading this data is just as recursive as writing it: for each node we read the node's value, then
the number of children in that node, then recursively read that many children.

```rust
impl<K, V> Node<K, V>
where
    K: Readable + Ord,
    V: Readable,
{
    fn read_recursive<R: std::io::Read>(reader: &mut R) -> std::io::Result<Self> {
        let value = V::read(reader)?;
        let mut node = Self::new(value);

        let nchildren = reader.read_u32::<BigEndian>()? as usize;
        while node.children.len() < nchildren {
            let key = K::read(reader)?;
            let child = Self::read_recursive(reader)?;
            node.children.insert(key, child);
        }

        Ok(node)
    }
}
```

# Retracing the Path

```rust
impl<K, V> Node<K, V>
where
    K: Writable + Default,
    V: Writable,
{
    fn write_retraced<W: Write>(&self, writer: &mut W) -> std::io::Result<()> {
        fn retrace<W: Write>(writer: &mut W, stack_depth: &mut u32) -> std::io::Result<()> {
            if *stack_depth > 0 {
                writer.write_u32::<BigEndian>(*stack_depth)?;
                *stack_depth = 0;
            }

            Ok(())
        }

        fn write_node<K: Writable, V: Writable, W: Write>(
            writer: &mut W,
            stack_depth: &mut u32,
            key: &K,
            node: &Node<K, V>,
        ) -> std::io::Result<()> {
            retrace(writer, stack_depth)?;

            key.write(writer)?;
            node.value.write(writer)?;

            writer.write_u32::<BigEndian>(node.children.len() as u32)?;
            for (key, child) in &node.children {
                write_node(writer, stack_depth, key, child)?;
            }

            *stack_depth += 1;
            Ok(())
        }

        let mut stack_depth = 0;
        write_node(writer, &mut stack_depth, &K::default(), self)?;
        retrace(writer, &mut stack_depth)
    }
}
```


```
Length: 68 (0x44) bytes
0000:   00 41 00 00  00 02 62 42  00 00 00 02  64 44 00 00   .A....bB....dD..
0010:   00 03 66 46  00 00 00 00  00 00 00 01  67 47 00 00   ..fF........gG..
0020:   00 00 00 00  00 01 68 48  00 00 00 00  00 00 00 02   ......hH........
0030:   65 45 00 00  00 00 00 00  00 02 63 43  00 00 00 00   eE........cC....
0040:   00 00 00 02                                          ....
```

We can read this block of data as a kind of program for building our tree. When we decode the
instructions, if we encounter a leaf node --- a node that has no children --- then we read the
number of steps to walk back up the tree to the next (super-)parent node. This results in a
"program" that looks like this:

| Step                 | Key  | Value  | No. Children  | Retrace |
| :------------------- | ---: | -----: | ------------: | ------: |
| `00 41 00 00 00 02`  |      | `A`    | 2             |         |
| `62 42 00 00 00 02`  | `b`  | `B`    | 2             |         |
| `64 44 00 00 00 03`  | `d`  | `D`    | 3             |         |
| `66 46 00 00 00 00`  | `f`  | `F`    | 0             |         |
| `00 00 00 01`        |      |        |               |       1 |
| `67 47 00 00 00 00`  | `g`  | `G`    | 0             |         |
| `00 00 00 01`        |      |        |               |       1 |
| `68 48 00 00 00 00`  | `h`  | `H`    | 0             |         |
| `00 00 00 02`        |      |        |               |       2 |
| `65 45 00 00 00 00`  | `e`  | `E`    | 0             |         |
| `00 00 00 02`        |      |        |               |       2 |
| `63 43 00 00 00 00`  | `c`  | `C`    | 0             |         |
| `00 00 00 02`        |      |        |               |       2 |

To evaluate this program, we maintain a working stack. The stack contains a list of key and node
pairs. As we read each instruction, if we're reading a node we push the key and the node onto the
stack. If we encounter a leaf node and a retrace value, we "retrace or steps" by popping the given
number of nodes off the stack, adding each node as a child to it's predecessor.

We can imagine this algorithm being implemented as a simple pseudo-code:

```
root = none
loop:
    read key, value, nchildren
    push (key, value) onto stack

    if nchildren > 0: continue

    read retrace
    while retrace-- > 0:
        pop (top_key, top_value) from stack
        if stack is empty:
            root = top_value
        else:
            stack[-1].children[top_key] = top_value

    if stack is empty: break
```

Notice that our stop condition is not actually when we've read all the instructions, but rather when
we have popped the last node off the stack.

Using the above algorithm, we can work through our instructions to build our simple tree:

| Step                | Stack          | Action                               | Tree                                                 |
| :-----              | :------------- | :----------------------------------- | :--------------------------------------------------- |
| `00 41 00 00 00 02` | `[A]`          | Push `A` onto the stack              |                                                      |
| `62 42 00 00 00 02` | `[A, B]`       | Push `B` onto the stack              |                                                      |
| `64 44 00 00 00 03` | `[A, B, D]`    | Push `D` onto the stack              |                                                      |
| `66 46 00 00 00 00` | `[A, B, D, F]` | Push `F` onto the stack              |                                                      |
| `00 00 00 01`       | `[A, B, D]`    | Pop `F` off the stack                |                                                      |
|                     | `[A, B, D]`    | Add `F` as a child of `D`            | A, B, D &rarr; F                                     |
| `67 47 00 00 00 00` | `[A, B, D, G]` | Push `G` onto the stack              |                                                      |
| `00 00 00 01`       | `[A, B, D]`    | Pop `G` off the stack                |                                                      |
|                     | `[A, B, D]`    | Add `G` as a child of `D`            | A, B, D &rarr; { F, G }                              |
| `68 48 00 00 00 00` | `[A, B, D, H]` | Push `H` onto the stack              |                                                      |
| `00 00 00 02`       | `[A, B, D]`    | Pop `H` off the stack (step 1)       |                                                      |
|                     | `[A, B, D]`    | Add `H` as a child of `D`            | A, B, D &rarr; { F, G, H }                           |
|                     | `[A, B]`       | Pop `D` off the stack (step 2)       |                                                      |
|                     | `[A, B]`       | Add `D` as a child of `B`            | A, B &rarr; D &rarr; { F, G, H }                     |
| `65 45 00 00 00 00` | `[A, B, E]`    | Push `E` onto the stack              |                                                      |
| `00 00 00 02`       | `[A, B]`       | Pop `E` off the stack (step 1)       |                                                      |
|                     | `[A, B]`       | Add `E` as a child of `B`            | A, B &rarr; { D &rarr; { F, G, H }, E }              |
|                     | `[A]`          | Pop `B` off the stack (step 2)       |                                                      |
|                     | `[A]`          | Add `B` as a child of `A`            | A &rarr; B &rarr; { D &rarr; { F, G, H }, E }        |
| `63 43 00 00 00 00` | `[A, C]`       | Push `C` onto the stack              |                                                      |
| `00 00 00 02`       | `[A]`          | Pop `C` off the stack (step 1)       |                                                      |
|                     | `[A]`          | Add `C` as a child of `A`            | A &rarr; { B &rarr; { D &rarr; { F, G, H }, E }, C } |
|                     | `[A]`          | Pop `A` off the stack (step 2)       |                                                      |
|                     | `[]`           | Stack is empty: `A` is our root node |                                                      |


Now that we've planned out our algorithm, we can implement it in Rust quite easily.

```rust
impl<K, V> Node<K, V>
where
    K: Readable + Ord,
    V: Readable,
{
    fn read_retraced<R: Read>(reader: &mut R) -> std::io::Result<Self> {
        // The stack of keys and nodes in our working stack.
        let mut stack = Vec::<(K, Node<K, V>)>::new();

        // The root node that we found in the stream: this is basically the last node that
        // we pop from the stack.
        let mut root = None;

        // A function to read a node from the stream.
        //
        // This reads the node's key, the value of the node, and the number of children
        // attached to the node. Note that this doesn't then recursively read the node's
        // children: that's implicit in the fact we're reading the node's children next
        // in the stream.
        fn read_node<K: Readable, V: Readable, R: Read>(
            reader: &mut R,
        ) -> std::io::Result<(K, Node<K, V>, usize)> {
            let key = K::read(reader)?;
            let node = Node::new(V::read(reader)?);
            let nchildren = reader.read_u32::<BigEndian>()? as usize;
            Ok((key, node, nchildren))
        }

        // Our main loop: we read a node from the stream and push it onto our stack. Then,
        // if the node has no children, we pop one or more nodes off the stack, and add
        // each node we've popped from the stack to their predecessors' children.

        loop {
            let (key, node, nchildren) = read_node(reader)?;

            stack.push((key, node));

            // If the node has children, then we're going to want to read more nodes from
            // the stream, so continue reading the next node.
            if nchildren > 0 {
                continue;
            }

            // This node has no children, so it's a leaf node. Read the 'retrace' value
            // from the stream, which is the number of steps back up the tree we need to
            // retrace to get to the next (super-)parent node.

            let mut retrace = reader.read_u32::<BigEndian>()? as usize;
            assert!(retrace <= stack.len());

            // Retrace our steps back up the tree to the next (super-)parent node. As we
            // retrace, we pop nodes off the stack and, if there's still a node left on
            // the stack, we add the freshly-popped node as a child.

            while retrace > 0 {
                let Some((key, node)) = stack.pop() else {
                    return Err(std::io::Error::new(ErrorKind::Other, "stack underflow"));
                };

                if let Some((_, parent)) = stack.last_mut() {
                    parent.children.insert(key, node);
                } else {
                    // We've actually popped the last node off the stack, so we must be
                    // at the root node. Store this node in our 'root' variable.
                    assert!(root.is_none());
                    root = Some(node);
                }

                retrace -= 1;
            }

            // If we've got nothing left on the stack, then we've retraced all the way to
            // the root node, and we can break out of the loop.

            if stack.is_empty() {
                break;
            }
        }

        root.ok_or_else(|| std::io::Error::new(ErrorKind::Other, "no root node found"))
    }
}
```

This sort of algorithm is somewhat easier to implement in languages like C++ or TypeScript, where
you can have multiple references to the same variable. For example, the same algorithm in C++ would
likely want to assign the `root` variable on the first node we found, rather than at the end of the
retrace loop. We might also prefer to simply add each node as a child of the top of the stack as we
read them, rather than pushing them all onto the stack and then adding them to their predecessors
set of children in the retrace loop.

```typescript
function readRetraced(reader: SomeReader): Node {
    const stack: Node[] = [];
    let root: Node | null = null;

    for (;;) {
        const { key, node, nchildren } = readNode(reader);

        if (stack.length > 0) {
            // Add the node immediately to it's predecessor's children.
            stack[stack.length - 1].children.set(key, node);
        }

        // Now push the node onto the stack, and also wire up the root node.
        stack.push(node);
        if (!root) {
            root = node:
        }

        if (nchildren > 0) {
            continue;
        }

        let retrace = reader.read32();
        while (retrace-- > 0) {
            stack.pop();
        }

        if (stack.length === 0) {
            return root;
        }
    }
}
```

In Rust,we can't have the node added as a child of the top of the stack, and also be in the stack
itself, and optionally also be assigned to the `root` variable, so we have to do a bit of shuffling
to move things around so the ownership of the node moves from the stack into it's predecessor.
