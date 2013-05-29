(function () {
    var OPTION_KEY = "refcontrol.actions";
    var cc = Components.classes;
    var ci = Components.interfaces;
    var RE_3RDPARTY = /^@3RDPARTY:/;
    var cPref = cc["@mozilla.org/preferences-service;1"];
    var pref = cPref.getService(ci.nsIPrefBranch2);
    
    var loadConf = function () {
        var conf = {};
        var actionDefs = pref.getCharPref(OPTION_KEY, "").split(" ");
        for (var i = 0; i < actionDefs.length; i += 1) {
            var actionDef = actionDefs[i];
            var index = actionDef.indexOf("=");
            if (index > 0) {
                var right = actionDef.substr(index + 1);
                var only3rd = right.match(RE_3RDPARTY) ? true : false;
                var action = right.replace(RE_3RDPARTY, "");
                if (action === "") action = "@BLOCK";
                conf[actionDef.substr(0, index)] = [action, only3rd];
            }
        }
        return conf;
    };
    var storeConf = function () {
        var lines = Object.keys(conf).map(function (key) {
            var value = conf[key];
            var only3rd = value[1];
            var action = value[0];
            if (action === "@BLOCK") action = "";
            return key + "=" + (only3rd ? "@3RDPARTY:" : "") + action;
        });
        pref.setCharPref(OPTION_KEY, lines.join(" "));
    };
    var conf = loadConf();
    var observer = {observe: function (subject, topic, data) {
        conf = loadConf();
        updateBox();
    }};
    
    var createItem = function (domain) {
        var value = conf[domain];
        var action = value[0];
        var only3rd = value[1];
        
        var item = document.createElement("listitem");
        var cellDomain = document.createElement("listcell");
        var cellAction = document.createElement("menulist");
        var cellOnly3rd = document.createElement("checkbox");
        var cellDelete = document.createElement("button");
        var actionPopup = document.createElement("menupopup");
        var actionNormal = document.createElement("menuitem");
        var actionForge = document.createElement("menuitem");
        var actionBlock = document.createElement("menuitem");
        actionNormal.setAttribute("label", "@NORMAL");
        actionForge.setAttribute("label", "@FORGE");
        actionBlock.setAttribute("label", "@BLOCK");
        actionPopup.appendChild(actionNormal);
        actionPopup.appendChild(actionForge);
        actionPopup.appendChild(actionBlock);
        cellAction.appendChild(actionPopup);
        cellDomain.setAttribute("label", domain);
        cellAction.setAttribute("label", action);
        cellAction.setAttribute("editable", true);
        cellOnly3rd.setAttribute("checked", only3rd);
        cellDelete.setAttribute("label", "delete");
        item.appendChild(cellDomain);
        item.appendChild(cellAction);
        item.appendChild(cellOnly3rd);
        item.appendChild(cellDelete);
        item.setAttribute("allowevents", true);
        
        cellAction.addEventListener("blur", function (ev) {
            conf[domain][0] = cellAction.label;
            storeConf();
        }, false);
        cellAction.addEventListener("command", function (ev) {
            conf[domain][0] = cellAction.label;
            storeConf();
        }, false);
        cellOnly3rd.addEventListener("command", function (ev) {
            conf[domain][1] = cellOnly3rd.checked;
            storeConf();
        }, false);
        cellDelete.addEventListener("click", function (ev) {
            delete conf[domain];
            storeConf();
        }, false);
        return item;
    };
    
    var updateBox = function () {
        var box = document.getElementById("box");
        var items = box.querySelectorAll("listitem");
        for (var i = 0; i < items.length; i++) {
            box.removeChild(items[i]);
        }
        var keys = Object.keys(conf).sort(domainCompare);
        keys.forEach(function (key) {
            var item = createItem(key);
            box.appendChild(item);
        });
    };
    
    var domainCompare = function (a, b) {
        var na = a.split(/\./).reverse();
        var nb = b.split(/\./).reverse();
        var l = Math.min(na.length, nb.length);
        for (var i = 0; i < l; i++) {
            if (na[i] < nb[i]) return -1;
            if (na[i] > nb[i]) return 1;
        }
        if (na.length < nb.length) return -1;
        if (na.length > nb.length) return 1;
        return 0;
    };
    
    // init
    window.addEventListener("load", function (ev) {
        pref.addObserver(OPTION_KEY, observer, false);
        updateBox();
        var add = document.getElementById("add");
        add.addEventListener("click", function (ev) {
            var domainElem = document.getElementById("domain");
            var domain = domainElem.value;
            if (!domain || domain in conf) return;
            conf[domain] = ["@BLOCK", false];
            storeConf();
            domainElem.value = "";
        }, false);
    }, false);
    window.addEventListener("close", function (ev) {
        pref.removeObserver(OPTION_KEY, observer);        
        //alert("close");
    }, false);
    window.addEventListener("dialogaccept", function (ev) {
        pref.removeObserver(OPTION_KEY, observer);        
        //alert("accept");
    }, false);
})();
