#
# GitHub Runner Dockerfile
#
# Some of this is inspired by https://github.com/tcardonne/docker-github-runner
#

FROM ubuntu:latest

ARG GIT_VERSION="2.30.1"
ARG DOCKER_COMPOSE_VERSION="1.29.2"
ARG GH_RUNNER_VERSION=""

ENV DEBIAN_FRONTEND=noninteractive
ENV RUNNER_NAME=""
ENV RUNNER_WORK_DIRECTORY="_work"
ENV RUNNER_TOKEN=""
ENV RUNNER_REPOSITORY_URL=""
ENV RUNNER_LABELS=""
ENV GITHUB_ACCESS_TOKEN=""
ENV RUNNER_ALLOW_RUNASROOT=true
ENV AGENT_TOOLSDIRECTORY=/opt/hostedtoolcache

RUN apt-get update && \
    apt-get install -y \
      curl unzip apt-transport-https ca-certificates software-properties-common sudo \
      jq iputils-ping build-essential zlib1g-dev gettext liblttng-ust0 \
      libcurl4-openssl-dev openssh-client awscli

# Install Docker CLI
RUN curl -fsSL https://get.docker.com -o- | sh

# Install Docker Compose
RUN curl -L -o /usr/local/bin/docker-compose \
      "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" && \
    chmod +x /usr/local/bin/docker-compose

# Install specific version of git
RUN cd /tmp && \
    curl -sL -o git.tgz \
      https://www.kernel.org/pub/software/scm/git/git-${GIT_VERSION}.tar.gz && \
    tar zxf git.tgz && \
    cd git-${GIT_VERSION} && \
    ./configure --prefix=/usr && \
    make -j && \
    make install && \
    rm -rf /tmp/git.tgz /tmp/git-${GIT_VERSION}

# Create directories for the GitHub runner
RUN mkdir -p /home/runner ${AGENT_TOOLSDIRECTORY}

WORKDIR /home/runner

RUN GH_RUNNER_VERSION=${GH_RUNNER_VERSION:-$(curl --silent "https://api.github.com/repos/actions/runner/releases/latest" | grep tag_name |  sed -E 's/.*"v([^"]+)".*/\1/')} && \
    curl -L -O https://github.com/actions/runner/releases/download/v${GH_RUNNER_VERSION}/actions-runner-linux-x64-${GH_RUNNER_VERSION}.tar.gz && \
    tar -xvzf actions-runner-linux-x64-${GH_RUNNER_VERSION}.tar.gz && \
    rm -f actions-runner-linux-x64-${GH_RUNNER_VERSION}.tar.gz && \
    ls -l && \
    ./bin/installdependencies.sh && \
    chown -R root: /home/runner

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT [ "/entrypoint.sh" ]
CMD [ "/home/runner/bin/runsvc.sh" ]