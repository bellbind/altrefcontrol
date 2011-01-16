#!/bin/bash

VERSION=$1
XPI=altrefcontrol-$VERSION.xpi

find . -print | grep -v '^\./\.git' | grep -v '\.xpi$' | grep -v 'update.rdf$' | zip -@ $XPI
SHA1=`sha1sum $XPI | awk '{print $1}'`

sed -e "s/@@VERSION@@/$VERSION/g;s/@@XPI@@/$XPI/g;s/@@SHA1@@/$SHA1/g" update.rdf.xml > update.rdf
