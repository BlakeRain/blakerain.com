FROM public.ecr.aws/lambda/provided:al2-arm64

ARG RUST_VERSION=1.58.1
RUN yum install -y jq openssl-devel gcc zip
RUN set -o pipefail && curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs \
  | CARGO_HOME=/cargo RUSTUP_HOME=/rustup sh -s -- -y --profile minimal --default-toolchain $RUST_VERSION
COPY build.sh /usr/local/bin/
VOLUME ["/lambda"]
WORKDIR /lambda
ENTRYPOINT ["/usr/local/bin/build.sh"]
