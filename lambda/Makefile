.PHONY: dependencies deploy-lambda

blakerain_build_search.zip: lambda_function.py dependencies
	rm -f blakerain_build_search.zip
	zip -r blakerain_build_search.zip .

dependencies: requirements.txt
	mkdir -p dependencies
	pip3 install --system -t `pwd`/dependencies -r requirements.txt

deploy-lambda: blakerain_build_search.zip
	aws lambda update-function-code --function blakerain_build_search --zip-file fileb://blakerain_build_search.zip --publish
