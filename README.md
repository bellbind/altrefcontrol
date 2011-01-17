# Alternative refControl firefox addon

A Firefox addon for replacing referer like refControl addon.
We made it from scratch.

## features

- Support firefox-4
- Switching Referers
- Use refControl addon setting
- Context menu UI

## Install

Download latest altrefcontrol-x.y.z.xpi file from 
[download page](https://github.com/bellbind/altrefcontrol/downloads)
(it requires permission to allow install from github.com)

## For development

### How to edit and check the addon

- make "profile" directory in top of the git source directory
- run firefox with "-profile profile/" option to initialize profile
- close firefox
- make "profile/extensions/" directory
- edit "profile/extensions/altrefcontrol@github.com" text file
  just to contain the absolute platform-specific git source path. 
  e.g.:

    C:\cygwin\home\bellbind\git\altrefcontrol

- run firefox with "-profile profile/" option again. it enabled the addon.
- restart firefox, edited addon will be loaded

### Release update and package build

After edit codes. update "em:version" in "install.rdf". 
e.g.:

    ./build.sh 0.1.1

then "altrefcontrol-0.1.1.xpi" and "update.rdf" are generated.

### Reference

- [userChrome.js script version](https://gist.github.com/777814) (ver 0.1 is just packaged as xpi)
- [RefControl addon](http://www.stardrifter.org/refcontrol/)
- [userChromeJS addon](http://userchromejs.mozdev.org/)

## License

Copyright (c) 2011 [bellbind](http://twitter.com/bellbind)
Released under MPL 1.1/GPL 2.0/LGPL 2.1 licenses.
