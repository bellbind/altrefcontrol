#!/bin/bash

XPI=$1

find . -name '*' -print | grep -v '\.xpi' | zip -@ $XPI
SHA1=`sha1sum $XPI | awk '{print $1}'`

sed -e "s/@@XPI@@/$XPI/g;s/@@SHA1@@/$SHA1/g" update.rdf.xml > update.rdf


