# See: https://github.com/softprops/lambda-rust
LAMBDA_SOURCES=$(shell find src/ -type f -name '*.rs')

USER_ID=$(shell id -u)
GROUP_ID=$(shell id -g)

API_TARGET="target/lambda/release/api.zip"
TRIGGER_TARGET="target/lambda/release/trigger.zip"

${API_TARGET} ${TRIGGER_TARGET} &: Cargo.toml Cargo.lock ${LAMBDA_SOUCES}
	docker run --rm --user "${USER_ID}":"${GROUP_ID}" \
		-v "${PWD}":/lambda \
		-v "${HOME}/.cargo/registry:/cargo/registry" \
		-v "${HOME}/.cargo/git:/cargo/git" \
		$$(docker build -q .)

.PHONY: api
api: ${API_TARGET}

.PHONY: trigger
trigger: ${TRIGGER_TARGET}

.PHONY: deploy
deploy: ${API_TARGET}
	aws lambda update-function-code --function-name blakerain-analytics-api --zip-file fileb://${API_TARGET} --publish
	aws lambda update-function-code --function-name blakerain-analytics-trigger --zip-file fileb://${TRIGGER_TARGET} --publish
