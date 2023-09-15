#!/bin/bash

set -eo pipefail

DB_CONTAINER_NAME="blakerain-analytics-db"
DB_CONTAINER_PORT=5101

# Stop the database docker container (if it is already running).
docker stop "$DB_CONTAINER_NAME" || true

# Start the local database, passing in defaults that correspond to those in 'local.toml'
# configuration file.
docker run --rm --name "$DB_CONTAINER_NAME" -d \
  -e POSTGRES_USER=analytics_local \
  -e POSTGRES_PASSWORD=analytics_local \
  -e POSTGRES_DB=analytics_local \
  -p $DB_CONTAINER_PORT:5432 \
  postgres:alpine \
  -c log_statement=all

# Make sure that 'cargo watch' is installed
cargo install cargo-watch

# Runt he language function, reloading any changes.
cargo watch -B 1 -L debug -- cargo run --features local --bin analytics

