#!/bin/bash
#
# Extract a file from a Docker image
#
# ./extract-docker-file.sh "<image-name>" "<file-name>" "<target>"
#

if [ $# -ne 3 ]; then
  echo "Usage: extract-docker-file.sh <image-name> <source-path> <target-path>"
  exit 1
fi

DOCKER_IMAGE_NAME="$1"
EXTRACT_FILE_PATH="$2"
TARGET_FILE_PATH="$3"

# Get the image ID
if [[ !"$DOCKER_IMAGE_NAME" =~ ^[0-9a-f]{12}$ ]]; then
  IMAGE_ID=$(docker images -q $DOCKER_IMAGE_NAME)
else
  IMAGE_ID="$DOCKER_IMAGE_NAME"
fi

echo "Received image ID: $IMAGE_ID"

# Make sure that we have a valid ID
if [[ !"$IMAGE_ID" =~ ^[0-9a-f]{12}$ ]]; then
  echo "The docker image ID '$IMAGE_ID' is invalid"
  exit 1
fi

# Create a container using the image
CONTAINER_ID=$(docker create $IMAGE_ID)

# Copy the requested file from the container to the target directory
docker cp $CONTAINER_ID:$EXTRACT_FILE_PATH $TARGET_FILE_PATH

# Remove the temporary container
docker rm -v $CONTAINER_ID
