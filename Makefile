.PHONY: all clean
default: all

CODE = $(shell find src -type f -name '*.js' | sort)
STYLES = $(shell find src -type f -name '*.sass' | sort)

ASSETS_IN = $(shell find assets -type f | sort)
ASSETS_OUT = $(ASSETS_IN:assets/%=dist/assets/%)

node_modules: package-lock.json
	npm install

dist:
	@mkdir -p dist/
dist/assets:
	@mkdir -p dist/assets/

dist/deck.html: src/deck.html dist
	node build/html-subst.js $< > $@
dist/assets/%: assets/% dist/assets
	cp $< $@

dist/deck.js: src/deck.js dist node_modules $(CODE)
	node node_modules/browserify/bin/cmd.js --exclude domino -e $< -o $@ --im
dist/deck.css: src/deck.sass dist $(STYLES) node_modules
	node node_modules/node-sass/bin/node-sass --output-style compressed $< > $@

all: dist/deck.html $(ASSETS_OUT) dist/deck.js dist/deck.css

clean:
	rm -rf dist/*

