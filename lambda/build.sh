#!/bin/bash

set -eo pipefail

# Define environment
export CARGO_HOME="/cargo"
export RUSTUP_HOME="/rustup"

# Create the build directory
mkdir -p target/lambda

# Tell Cargo to build into this directory
export CARGO_TARGET_DIR=$PWD/target/lambda

# Source the Cargo environment
. $CARGO_HOME/env

# Run Cargo build
cargo build --release

# Package up the executables
for EXECUTABLE in $(cargo metadata --no-deps --format-version=1 | jq -r '.packages[] | .targets[] | select(.kind[] | contains("bin")) | .name'); do
  echo "Bundling lambda package for $EXECUTABLE"
  EXE_PATH="$CARGO_TARGET_DIR/release/$EXECUTABLE"
  OUTPUT_DIR="$CARGO_TARGET_DIR/release/output/$EXECUTABLE"

  # Remove any old output directory and zip file
  rm -r "$OUTPUT_DIR" > 2&>/dev/null || true
  rm "$CARGO_TARGET_DIR/release/$EXECUTABLE.zip" > 2&>/dev/null || true

  # Copy the executable to the output directory
  mkdir -p "$OUTPUT_DIR"
  cp "$EXE_PATH" "$OUTPUT_DIR/bootstrap"

  mkdir -p "$OUTPUT_DIR/lib"

  if [[ $EXECUTABLE = "api" ]]; then
    cp $(ldd "$EXE_PATH" | grep ssl | awk '{print $3}') "$OUTPUT_DIR/lib/"
  fi

  # Strip the executable
  objcopy --strip-debug --strip-unneeded "$OUTPUT_DIR/bootstrap"

  # Create the zip file
  cd "$OUTPUT_DIR" && zip -r "$CARGO_TARGET_DIR/release/$EXECUTABLE.zip" .
  # zip -r "$CARGO_TARGET_DIR/release/$EXECUTABLE.zip" "$OUTPUT_DIR"
done

