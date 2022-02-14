#!/bin/bash

for fileName in $(find ./static -type f -name '*.html' -o -name '*.css' -o -name '*.js'); do
	gzip -9 -c $fileName > $fileName.gz
done