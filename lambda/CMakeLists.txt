#
# Lambda functions
#

cmake_minimum_required(VERSION 3.10.0)
project("Lambda Functions" LANGUAGES NONE)

# Find all the directories of the lambda functions
file(GLOB LAMBDA_DIRS *)

# The set of lambda functions and their deployment targets
set(LAMBDA_TARGETS "")
set(LAMBDA_DEPLOY_TARGETS "")

# Iterate over the lambda directories and create the build and deployment targets
foreach(LAMBDA_DIR ${LAMBDA_DIRS})
  if(IS_DIRECTORY ${LAMBDA_DIR})
    # Work out the name of the lambda function
    get_filename_component(LAMBDA_NAME ${LAMBDA_DIR} NAME)
    
    # Exclude the 'build' directory
    if(${LAMBDA_NAME} STREQUAL "build")
      continue()
    endif()

    string(TOLOWER ${LAMBDA_NAME} LAMBDA_DOCKER_IMAGE)
    message(STATUS "Found lambda function: ${LAMBDA_NAME}")

    # Set the output directory for this lambda function
    set(LAMBDA_BIN_DIR ${CMAKE_CURRENT_BINARY_DIR}/${LAMBDA_NAME})

    # Add a configuration for the Dockerfile for this lambda
    configure_file(${CMAKE_CURRENT_SOURCE_DIR}/Dockerfile.in ${LAMBDA_BIN_DIR}/Dockerfile @ONLY)

    # Find all the sources for this lambda function
    file(GLOB_RECURSE LAMBDA_SOURCES LIST_DIRECTORIES false ${LAMBDA_DIR}/*)

    # Add a custom command to create the 'src' directory and it's content
    add_custom_command(OUTPUT ${LAMBDA_BIN_DIR}/src/.dirstamp
      # Create the 'src' directory for the Docker context
      COMMAND mkdir -p ${LAMBDA_BIN_DIR}/src/dependencies
      # Copy over the contents of the lambda directory
      COMMAND cp -r ${LAMBDA_DIR}/* ${LAMBDA_BIN_DIR}/src/
      # Touch the .dirstamp to keep things in sync
      COMMAND touch ${LAMBDA_BIN_DIR}/src/.dirstamp
      # Settings
      WORKING_DIRECTORY ${PROJECT_SOURCE_DIR}
      DEPENDS ${LAMBDA_SOURCES})

    # Add a custom command to run Docker to build this lambda function
    add_custom_command(OUTPUT ${LAMBDA_BIN_DIR}/docker.build.stamp
      COMMAND docker build --rm -t ${LAMBDA_DOCKER_IMAGE} .
      COMMAND touch ${LAMBDA_BIN_DIR}/docker.buil.stamp
      WORKING_DIRECTORY ${LAMBDA_BIN_DIR}
      DEPENDS ${LAMBDA_BIN_DIR}/src/.dirstamp ${LAMBDA_BIN_DIR}/Dockerfile)

    # Add a custom command to extract the lambda function ZIP file from the Docker image
    add_custom_command(OUTPUT ${LAMBDA_BIN_DIR}/${LAMBDA_NAME}.zip
      COMMAND ${CMAKE_CURRENT_SOURCE_DIR}/extract-docker-file.sh
              "${LAMBDA_DOCKER_IMAGE}" "/app/${LAMBDA_NAME}.zip" "${LAMBDA_BIN_DIR}/${LAMBDA_NAME}.zip"
      DEPENDS ${LAMBDA_BIN_DIR}/docker.build.stamp)

    # Add an alias target to the zip file so it's easier to address this lambda function
    add_custom_target(${LAMBDA_NAME} DEPENDS ${LAMBDA_BIN_DIR}/${LAMBDA_NAME}.zip)

    # Add a custom target that uploads the lambda function to AWS
    add_custom_target(deploy-${LAMBDA_NAME}
      COMMAND aws lambda update-function-code --function ${LAMBDA_NAME} --zip-file
              fileb://${LAMBDA_BIN_DIR}/${LAMBDA_NAME}.zip --publish
      DEPENDS ${LAMBDA_BIN_DIR}/${LAMBDA_NAME}.zip)

    list(APPEND LAMBDA_TARGETS ${LAMBDA_NAME})
    list(APPEND LAMBDA_DEPLOY_TARGETS deploy-${LAMBDA_NAME})
  endif()
endforeach()

# Add a target to build all the lambda functions
add_custom_target(lambdas DEPENDS ${LAMBDA_TARGETS})

# Add a target to deploy all the lambdas
add_custom_target(deploy-lambdas DEPENDS ${LAMBDA_DEPLOY_TARGETS})
