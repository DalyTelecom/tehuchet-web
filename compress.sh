#!/bin/bash

for fileName in $(find ./static -type f -name '*.html' -o -name '*.css' -o -name '*.js'); do
	if [ $( which zopfli ) ]
	then
		zopfli -i30 $fileName
	else
		gzip -9 -c $fileName > $fileName.gz
	fi
done