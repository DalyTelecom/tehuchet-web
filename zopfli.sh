#!/bin/bash

for fileName in $(find ./static -type f -name '*.html' -o -name '*.css' -o -name '*.js'); do
	zopfli -i30 $fileName
done