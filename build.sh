#!/bin/bash
# automated tool for building xpi and update.rdf
# required commands: ruby find grep zip sha1sum sed

VERSION=`ruby -ane  'print $1 if /<em:version>(.*)<\/em:version>/' install.rdf`
XPI=altrefcontrol-$VERSION.xpi

find . -print | \
  grep -v '^\./\.git' | grep -v '^\./profile/' | \
  grep -v '\.xpi$' | grep -v '\.sh$' | grep -v 'update.rdf$' | \
  zip -@ $XPI
SHA1=`sha1sum $XPI | ruby -ane 'print $F[0]'`

sed -e "s/@@VERSION@@/$VERSION/g;s/@@XPI@@/$XPI/g;s/@@SHA1@@/$SHA1/g" update.rdf.xml > update.rdf
