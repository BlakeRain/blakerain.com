#!/bin/bash

set -eo pipefail

MODE="$1"
if [[ "$MODE" = "debug" ]]; then
  MODE=""
fi

if [[ ! -z "$MODE" ]]; then
  if [[ "$MODE" != "release" ]]; then
      echo "Unknown build mode '$MODE'; expected either 'debug' or 'release'"
      exit 1
  fi

  MODE="--$MODE"
fi

echo trunk build $MODE --features hydration
trunk build $MODE --features hydration
echo cargo run $MODE --features static --bin site-build
cargo run $MODE --features static --bin site-build
