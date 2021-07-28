#!/bin/bash

if [[ "$@" == "bash" ]]; then
  exec $@
fi

if [[ -z $RUNNER_NAME ]]; then
  echo "RUNNER_NAME environment variable is not set, using '${HOSTNAME}'"
  export RUNNER_NAME=${HOSTNAME}
fi

echo "Using runner name: ${RUNNER_NAME}"

if [[ -z $RUNNER_WORK_DIRECTORY ]]; then
  echo "RUNNER_WORK_DIRECTORY environment variable is not set, using '_work'"
  export RUNNER_WORK_DIRECTORY="_work"
fi

echo "Using runner work directory: ${RUNNER_WORK_DIRECTORY}"

if [[ -z $RUNNER_TOKEN && -z $GITHUB_ACCESS_TOKEN ]]; then
  echo "ERROR: You must set either RUNNER_TOKEN or GITHUB_ACCESS_TOKEN environment variable"
  exit 1
fi

if [[ -n $RUNNER_TOKEN ]]; then
  echo "Using runner token"
elif [[ -n $GITHUB_ACCESS_TOKEN ]]; then
  echo "Using GitHub access token (will be exchanged for runner token)"
fi

if [[ -z $RUNNER_REPOSITORY_URL && -z $RUNNER_ORGANIZATION_URL ]]; then
  echo "ERROR: You must set either RUNNER_REPOSITORY_URL or RUNNER_ORGANIZATION_URL environment variable"
  exit 1
fi

if [[ -n $RUNNER_REPOSITORY_URL ]]; then
  echo "Connecting to repository: ${RUNNER_REPOSITORY_URL}"
elif [[ -n $RUNNER_ORGANIZATION_URL ]]; then
  echo "Connecting to organisation: ${RUNNER_ORGANIZATION_URL}"
fi

if [[ -z $RUNNER_REPLACE_EXISTING ]]; then
  export RUNNER_REPLACE_EXISTING="true"
fi

CONFIG_OPTS=""
if [ "$(echo $RUNNER_REPLACE_EXISTING | tr '[:upper:]' '[:lower:]')" == "true" ]; then
  CONFIG_OPTS="--replace"
fi

if [[ -n $RUNNER_LABELS ]]; then
  CONFIG_OPTS="${CONFIG_OPTS} --labels ${RUNNER_LABELS}"
fi

echo "Runner configuration options: ${CONFIG_OPTS}"

if [[ -r ".runner" ]]; then
  echo "Runner already configured. Skipping config."
else
  if [[ ! -z $RUNNER_ORGANIZATION_URL ]]; then
    SCOPE="orgs"
    RUNNER_URL="${RUNNER_ORGANIZATION_URL}"
  else
    scope="repos"
    RUNNER_URL="${RUNNER_REPOSITORY_URL}"
  fi

  if [[ -n $GITHUB_ACCESS_TOKEN ]]; then
    echo "Exchanging the GitHub Access Token with a Runner Token (scope: ${SCOPE}) ..."

    _PROTO="$(echo "${RUNNER_URL}" | grep :// | sed -e's,^\(.*://\).*,\1,g')"
    _URL="$(echo "${RUNNER_URL/${_PROTO}/}")"
    _PATH="$(echo "${_URL}" | grep / | cut -d/ -f2-)"

    RUNNER_TOKEN="$(curl -XPOST -fsSL \
      -H "Authorization: token ${GITHUB_ACCESS_TOKEN}" \
      -H "Accept: application/vnd.github.v3+json" \
      "https://api.github.com/${SCOPE}/${_PATH}/actions/runners/registration-token" \
      | jq -r '.token')"
  fi

  echo "Configuring GitHub runner ..."

  ./config.sh \
    --url $RUNNER_URL \
    --token $RUNNER_TOKEN \
    --name $RUNNER_NAME \
    --work $RUNNER_WORK_DIRECTORY \
    $CONFIG_OPTS \
    --unattended
fi

exec "$@"
