.PHONY: all build patch minor major do_patch do_minor do_major publish

all: node_modules build

node_modules: package.json package-lock.json
	npm install

patch: node_modules do_patch
minor: node_modules do_minor
major: node_modules do_major

publish: build
	npm publish

do_patch:
	npm version patch

do_minor:
	npm version minor

do_major:
	npm version major

build:
	npm start
