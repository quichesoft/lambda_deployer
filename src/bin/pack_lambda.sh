#!/bin/sh

set -e

# extract variables
PREPACK_CMD=$(echo "$1" | jq -r '.prepack_cmd')
ROOT_DIR=$(echo "$1" | jq -r '.path')

# prepare folder structure
cd "$ROOT_DIR"
rm -rf .tmp
mkdir -p .tmp

# build lambda
eval "$PREPACK_CMD" &>/dev/null
rsync -az build/ .tmp
cp package.json .tmp
cp package-lock.json .tmp
cd .tmp

# install dependencies
npm install --production --silent &>/dev/null
# check for linux machine
if [[ "$(uname -s)" != *"Linux"* ]]; then
  docker run --rm -v "$PWD":/var/task lambci/lambda:build-nodejs12.x npm rebuild &>/dev/null
fi

# cleanup
rm package.json
rm package-lock.json
zip -q -r code.zip .
cd ..
cp .tmp/code.zip .
rm -r .tmp

# final output
jq -n --arg file "$ROOT_DIR/code.zip" '{"file":$file}'
