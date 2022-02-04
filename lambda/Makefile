LAMBDA_ARCH="linux/arm64"
RUST_TARGET="aarch64-unknown-linux-gnu"
RUST_VERSION="latest"
LAMBDA_SOURCES=$(shell find src/ -type f -name '*.rs')

target/release/{api,trigger} &: Cargo.toml Cargo.lock ${LAMBDA_SOUCES}
	docker run \
		--platform ${LAMBDA_ARCH} \
		--rm \
		--user "$(id -u)":"$(id -g)" \
		-v "${PWD}":/usr/src/lambda \
		-w /usr/src/lambda \
		rust:${RUST_VERSION} \
		cargo build --release --target ${RUST_TARGET}

