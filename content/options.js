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
    
    var createTreeItem = function (domain, action, only3rd) {
        var item = document.createElement("treeitem");
        var row = document.createElement("treerow");
        var cellDomain = document.createElement("treecell");
        var cellAction = document.createElement("treecell");
        var cellOnly3rd = document.createElement("treecell");
        cellDomain.setAttribute("label", domain);
        cellAction.setAttribute("label", action);
        cellOnly3rd.setAttribute("value", only3rd);
        cellOnly3rd.setAttribute("label", only3rd);
        cellOnly3rd.setAttribute("editable", true);
        row.appendChild(cellDomain);
        row.appendChild(cellAction);
        row.appendChild(cellOnly3rd);
        item.appendChild(row);
        return item;
    };
    
    window.addEventListener("load", function (ev) {
        var tree = document.getElementById("tree");
        var container = document.getElementById("container");
        var conf = loadConf();
        Object.keys(conf).forEach(function (key) {
            var value = conf[key];
            var item = createTreeItem(key, value[0], value[1]);
            container.appendChild(item);
        });
    }, false);
})();
