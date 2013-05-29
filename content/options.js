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
                conf[actionDef.substr(0, index)] = [action, only3rd];
            }
        }
        return conf;
    };
    
    var createItem = function (conf, domain) {
        var value = conf[domain];
        var action = value[0];
        var only3rd = value[1];
        
        var item = document.createElement("listitem");
        var cellDomain = document.createElement("textbox");
        var cellAction = document.createElement("menulist");
        var cellOnly3rd = document.createElement("checkbox");
        var cellDelete = document.createElement("button");
        var actionPopup = document.createElement("menupopup");
        var actionNormal = document.createElement("menuitem");
        var actionForge = document.createElement("menuitem");
        var actionBlock = document.createElement("menuitem");
        actionNormal.setAttribute("label", "@NORMAL");
        actionForge.setAttribute("label", "@FORGE");
        actionBlock.setAttribute("label", "");
        actionPopup.appendChild(actionNormal);
        actionPopup.appendChild(actionForge);
        actionPopup.appendChild(actionBlock);
        cellAction.appendChild(actionPopup);
        
        cellAction.appendChild(actionPopup);
        cellDomain.setAttribute("value", domain);
        cellAction.setAttribute("label", action);
        cellAction.setAttribute("editable", true);
        cellOnly3rd.setAttribute("checked", only3rd);
        cellDelete.setAttribute("label", "delete");
        item.appendChild(cellDomain);
        item.appendChild(cellAction);
        item.appendChild(cellOnly3rd);
        item.appendChild(cellDelete);
        item.setAttribute("allowevents", true);
        return item;
    };
    
    window.addEventListener("load", function (ev) {
        var box = document.getElementById("box");
        box.addEventListener("select", function (ev) {
            ev.preventDefault();
        }, true);
        var conf = loadConf();
        Object.keys(conf).forEach(function (key) {
            var item = createItem(conf, key);
            box.appendChild(item);
        });
    }, false);
})();
