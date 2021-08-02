#!/bin/bash
#
# GitHub Runner Configuration Script
#
# Some of this is inspired by https://github.com/tcardonne/docker-github-runner
#

# Allow running bash directly, rather than the service runner
if [[ "$@" == "bash" ]]; then
  exec $@
fi

# Ensure that we've got a runner token
if [[ -z $RUNNER_TOKEN ]]; then
  echo "ERROR: You must set either RUNNER_TOKEN or GITHUB_ACCESS_TOKEN environment variable"
  exit 1
fi

# Make sure that the runner has a name, falling back to the hostname
if [[ -z $RUNNER_NAME ]]; then
  echo "RUNNER_NAME environment variable is not set, using '${HOSTNAME}'"
  export RUNNER_NAME=${HOSTNAME}
fi

echo "Using runner name: ${RUNNER_NAME}"

# Make sure that the runner has a work directory, falling back to '_work' if not
if [[ -z $RUNNER_WORK_DIRECTORY ]]; then
  echo "RUNNER_WORK_DIRECTORY environment variable is not set, using '_work'"
  export RUNNER_WORK_DIRECTORY="_work"
fi

echo "Using runner work directory: ${RUNNER_WORK_DIRECTORY}"

# Ensure that we have either a repository or organisation URL
if [[ ! -z $RUNNER_REPOSITORY_URL ]]; then
  SCOPE="repos"
  RUNNER_URL="${RUNNER_REPOSITORY_URL}"
  echo "Connecting to repository: ${RUNNER_REPOSITORY_URL}"
elif [[ !-z $RUNNER_ORGANIZATION_URL ]]; then
  SCOPE="repos"
  RUNNER_URL="${RUNNER_ORGANIZATION_URL}"
  echo "Connecting to organisation: ${RUNNER_ORGANIZATION_URL}"
else
  echo "ERROR: You must set either RUNNER_REPOSITORY_URL or RUNNER_ORGANIZATION_URL environment variable"
  exit 1
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

# Configure the runner, unless we've already got one
if [[ -f ".runner" ]]; then
  echo "Runner already configured. Skipping config."
else
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
