# AWS Lambda deployer

## How to use:
 - Required packages in path are: jq, zip, rsync, docker for non-linux machine
 - Install **lambda_deployer** as npm package
 
 ```
 npm i --save-dev git+ssh://git@github.com:quichesoft/lambda_deployer.git
 ```
 
 - Add deploy section to project **package.json**
 
```
"deployment": { 
    "aws_bucket": "qs-foo-lambda-code",
    "aws_profile": "foo",
    "aws_lambda_function_name": {
        "test": "api-lambda"
    },
    "aws_region": "eu-west-1"
}
```
 - Add deploy run commands

```
"scripts": { 
    "deploy-test": "node_modules/.bin/lambda_deployer deploy test",
    "deploy-production": "node_modules/.bin/lambda_deployer deploy production"
}
```
