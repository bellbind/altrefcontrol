# Alternative refControl firefox addon

A Firefox addon for replacing referer like refControl addon.

## features

- Support firefox-4
- Switching Referers
- Use refControl addon setting
- Context menu UI

## release update and package build

After edit codes. update "em:version" in "install.rdf". 
e.g.:

    ./build.sh 0.1.1

then "altrefcontrol-0.1.1.xpi" and "update.rdf" are generated.


## Reference

- [userChrome.js script version](https://gist.github.com/777814) (ver 0.1 is just packaged as xpi)
- [RefControl addon](http://www.stardrifter.org/refcontrol/)
- [userChromeJS addon](http://userchromejs.mozdev.org/)

## License

Copyright (c) 2011 [bellbind](http://twitter.com/bellbind)
Released under MPL 1.1/GPL 2.0/LGPL 2.1 licenses.
