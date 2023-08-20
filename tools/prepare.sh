#!/bin/bash

echo "Running 'yarn install' to install front-end dependencies ..."
yarn install

if [[ "$TRUNK_PROFILE" = "debug" ]]; then
  LABEL="Debug"
  ENV=""
elif [[ "$TRUNK_PROFILE" = "release" ]]; then
  LABEL="Release"
  ENV=""
else
  echo "Unrecognized 'TRUNK_PROFILE' value '$TRUN_PROFILE'; expected either 'debug' or 'release'"
  exit 1
fi
  
echo "Running 'yarn postcss-build' to build CSS ($LABEL) ..."
NODE_ENV=$ENV yarn postcss-build
