---
title: Using Higher-Order Macros in Rust
date: 2026-08-16T16:00:00
tags:
  - rust
---

```rust
use paste::paste;

macro_rules! gen_enum {
    (
        $(
            $name:ident = $enum_name:ident {
                $( $operand_name:ident : $operand_type:ty ),*
            }
        ),*
    ) => {
        $(
            pub struct $enum_name {
                $(
                    pub $operand_name: $operand_type
                ),*
            }

            impl $enum_name {
                pub fn new(
                    $(
                        $operand_name: $operand_type
                    ),*
                ) -> Self {
                    Self {
                        $( $operand_name ),*
                    }
                }
            }
        )*

        pub enum Op {
            $(
                $enum_name($enum_name),
            )*
        }

        impl Op {
            $(
                pub fn $name(
                    $(
                        $operand_name: $operand_type
                    ),*
                ) -> Self {
                    Self::$enum_name($enum_name::new( $( $operand_name ),* ))
                }
            )*
        }

        paste! {
            pub trait OpVisitor {
                type Error;

                $(
                    #[allow(unused_variables)]
                    fn [<visit_ $name>](&self, op: &$enum_name) -> Result<(), Self::Error> {
                        Ok(())
                    }
                )*

                fn visit(&self, op: &Op) -> Result<(), Self::Error> {
                    match op {
                        $(
                            Op::$enum_name(op) => self.[<visit_ $name>](op),
                        )*
                    }
                }
            }
        }
    }
}

macro_rules! for_each_op {
    ($macro:ident) => {
        $macro! {
            nop = Nop {},
            pop = Pop {},
            dup = Dup {},
            iconst = IConst { value: i64 },
            fconst = FConst { value: f64 }
        }
    }
}

for_each_op!(gen_enum);
```
