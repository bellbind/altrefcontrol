#!/bin/bash
# automated tool for building xpi and update.rdf
# required commands: ruby find grep zip sha1sum sed

VERSION=`ruby -ane  'print $1 if /<em:version>(.*)<\/em:version>/' install.rdf`
MAX_VERSION=`ruby -ane  'print $1 if /<em:maxVersion>(.*)<\/em:maxVersion>/' install.rdf`
XPI=altrefcontrol-$VERSION.xpi

find . -print | \
  grep -v '^\./\.git' | grep -v '^\./profile/' | \
  grep -v '\.xpi$' | grep -v '\.sh$' | grep -v 'update.rdf$' | \
  zip -@ $XPI


if which sha1sum > /dev/null; then
    SHA1SUM=sha1sum
elif which shasum > /dev/null; then
    SHA1SUM="shasum -a 1"
fi

SHA1=`$SHA1SUM $XPI | ruby -ane 'print $F[0]'`

sed -e "s/@@MAX_VERSION@@/$MAX_VERSION/g;s/@@VERSION@@/$VERSION/g;s/@@XPI@@/$XPI/g;s/@@SHA1@@/$SHA1/g;" update.rdf.xml > update.rdf
