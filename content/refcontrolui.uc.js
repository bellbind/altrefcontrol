// ==UserScript==
// @name refcontrolui.uc.js 
// @include main
// @include chrome://browser/content/browser.xul
// @description Interface for refcontrol.uc.js
// @version 0.2
// @author bellbind
// @license MPL 1.1/GPL 2.0/LGPL 2.1
// @homepage https://github.com/bellbind/altrefcontrol
// ==/UserScript==

(function () {
  var OPTION_KEY = "refcontrol.actions";
  var RE_3RDPARTY = /^@3RDPARTY:/;
  
  var cc = Components.classes;
  var ci = Components.interfaces;
  
  // [configuration manage]
  var cPrompt = cc["@mozilla.org/embedcomp/prompt-service;1"];
  var prompt = cPrompt.getService(ci.nsIPromptService);
  var cPref = cc["@mozilla.org/preferences-service;1"];
  var pref = cPref.getService(ci.nsIPrefBranch2);
  var newObserver = function (handler) {
    // see: https://developer.mozilla.org/en/nsIObserver
    return {"observe": handler};
  };
  
  var conf = {};
  
  var readOptions = function (conf) {
    // see: https://developer.mozilla.org/en/nsIPrefBranch2
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
  };
  
  var writeOptions = function (conf) {
    var lines = [];
    for (var key in conf) {
      var value = conf[key];
      lines.push(key + "=" + (value[1] ? "@3RDPARTY:" : "") + value[0]);
    }
    pref.setCharPref(OPTION_KEY, lines.join(" "));
  };
  
  var updateConf = function () {
    conf = {};
    readOptions(conf);
  };
  
  var handlerSyncOptions = function (subject, topic, data) {
    updateConf();
  };
  
  updateConf();
  pref.addObserver(OPTION_KEY, newObserver(handlerSyncOptions), false);
  
  
  // [context menus]
  var menuData = [
    ["normal", "Normal", "@NORMAL"],
    ["block", "Block", ""],
    ["forge", "Forge", "@FORGE"],
  ];
  
  var setMenuLabels = function () {
    var host = window.content.location.host;
    var value = conf[host];
    var action = value ? value[0] : null;
    var only3rd = value ? value[1] : false;
    var label = "\"" + host + "\"";
    domain.setAttribute("label", label);
    if (!!action && action[0] != "@") {
      edit.setAttribute("label", action);
      edit.setAttribute("checked", true);
    } else {
      edit.setAttribute("label", "(Edit)");
      edit.setAttribute("checked", false);
    }
    for (var i = 0; i < menuData.length; i += 1) {
      var data = menuData[i];
      var item = items[data[0]];
      item.setAttribute("checked", action == data[2] ? "true" : "false");
    }
    third.setAttribute("checked", only3rd ? "true" : "false");
  };
  
  var setDefaultMenuLabels = function () {
    var value = conf["@DEFAULT"];
    var action = value ? value[0] : -1;
    var only3rd = value ? value[1] : false;
    for (var i = 0; i < menuData.length; i += 1) {
      var data = menuData[i];
      var item = defaultItems[data[0]];
      item.setAttribute("checked", action == data[2] ? "true" : "false");
    }
    defaultThird.setAttribute("checked", only3rd ? "true" : "false");
  };
  
  var setActionCommand = function (item, action) {
    return function () {
      var host = window.content.location.host;
      if (item.getAttribute("checked") == "true") {
        delete conf[host];
      } else {
        var value = conf[host] || ["", false];
        value[0] = action;
        conf[host] = value;
      }
      writeOptions(conf);
    };
  };
  
  var setDefaultActionCommand = function (item, action) {
    return function () {
      var host = "@DEFAULT";
      if (item.getAttribute("checked") == "true") {
        delete conf[host];
      } else {
        var value = conf[host] || ["", false];
        value[0] = action;
        conf[host] = value;
      }
      writeOptions(conf);
    };
  };
  
  var setActionEditCommand = function () {
    var host = window.content.location.host;
    var value = conf[host] || ["", false];
    var input = {"value": value[0]};
    var result = prompt.prompt(
      window, "Edit referer action", "Referer URI", input, 
      "", {"checked":false});
    if (result) {
      value[0] = input.value;
      conf[host] = value;
      writeOptions(conf);
    }
  };
  
  var setThirdCommand = function () {
    var host = window.content.location.host;
    var values = conf[host];
    if (values !== undefined) {
      var current = third.getAttribute("checked") == "true";
      values[1] = !current;
      writeOptions(conf);
    }
  };
  
  var setDefaultThirdCommand = function () {
    var host = "@DEFAULT";
    var values = conf[host];
    if (values !== undefined) {
      var current = defaultThird.getAttribute("checked") == "true";
      values[1] = !current;
      writeOptions(conf);
    }
  };
  
  // build UI
  // see: https://developer.mozilla.org/en/XUL/menu
  // see: https://developer.mozilla.org/en/XUL/menuitem
  var menu = document.createElement("menu");
  menu.id = "refcontrolui.menu";
  menu.setAttribute("label", "Referer Control");
  menu.hidden = false;
  menu.className = "menu-iconic";
  menu.addEventListener("popupshowing", setMenuLabels, false);
  
  var popup = document.createElement("menupopup");
  menu.appendChild(popup);
  
  var domain = document.createElement("menuitem");
  domain.id = "refcontrolui.menu.domain";
  domain.className = "menuitem-non-iconic";
  popup.appendChild(domain);
  popup.appendChild(document.createElement("menuseparator"));
  
  var items = {};
  for (var i = 0; i < menuData.length; i += 1) {
    var data = menuData[i];
    var item = document.createElement("menuitem");
    item.id = "refcontrolui.menu." + data[0];
    item.setAttribute("label", data[1]);
    item.hidden = false;
    item.setAttribute("checked", "false");
    item.className = "menuitem-iconic";
    item.addEventListener("command", setActionCommand(item, data[2]), false);
    popup.appendChild(item);
    items[data[0]] = item;
  }
  
  var edit = document.createElement("menuitem");
  edit.id = "refcontrolui.menu.edit";
  edit.setAttribute("label", "(Edit)");
  edit.hidden = false;
  edit.setAttribute("checked", "false");
  edit.className = "menuitem-iconic";
  edit.addEventListener("command", setActionEditCommand, false);
  popup.appendChild(edit);
  
  popup.appendChild(document.createElement("menuseparator"));
  var third = document.createElement("menuitem");
  third.id = "refcontrolui.menu.3rd";
  third.setAttribute("label", "3rd party only");
  third.hidden = false;
  third.setAttribute("checked", "false");
  third.className = "menuitem-iconic";
  third.addEventListener("command", setThirdCommand, false);
  popup.appendChild(third);
  
  popup.appendChild(document.createElement("menuseparator"));
  
  // UI for default action edit
  var defaultMenu = document.createElement("menu");
  defaultMenu.id = "refcontrolui.menu.default";
  defaultMenu.setAttribute("label", "All Site");
  defaultMenu.hidden = false;
  defaultMenu.className = "menu-non-iconic";
  defaultMenu.addEventListener("popupshowing", setDefaultMenuLabels, false);
  popup.appendChild(defaultMenu);
  
  var defaultPopup = document.createElement("menupopup");
  defaultMenu.appendChild(defaultPopup);
  
  var defaultItems = {};
  for (var i = 0; i < menuData.length; i += 1) {
    var data = menuData[i];
    var item = document.createElement("menuitem");
    item.id = "refcontrolui.menu.default." + data[0];
    item.setAttribute("label", data[1]);
    item.hidden = false;
    item.setAttribute("checked", "false");
    item.className = "menuitem-iconic";
    item.addEventListener(
      "command", setDefaultActionCommand(item, data[2]), false);
    defaultPopup.appendChild(item);
    defaultItems[data[0]] = item;
  }
  defaultPopup.appendChild(document.createElement("menuseparator"));
  var defaultThird = document.createElement("menuitem");
  defaultThird.id = "refcontrolui.menu.default.3rd";
  defaultThird.setAttribute("label", "3rd party only");
  defaultThird.hidden = false;
  defaultThird.setAttribute("checked", "false");
  defaultThird.className = "menuitem-iconic";
  defaultThird.addEventListener("command", setDefaultThirdCommand, false);
  defaultPopup.appendChild(defaultThird);
  
  // see: https://developer.mozilla.org/ja/XUL/PopupGuide/Extensions
  var contextMenu = document.getElementById("contentAreaContextMenu");
  contextMenu.appendChild(menu);
})();

//[changelog]
//0.2
//  * Add Referer Edit UI
//0.1
//  * UI as context menu
//  * Edit only refControl compatible area
