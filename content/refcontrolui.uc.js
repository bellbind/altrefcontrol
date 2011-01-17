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
  
  var cc = Components.classes;
  var ci = Components.interfaces;
  
  var RefControlSettings = function (pref_key) {
    var cPref = cc["@mozilla.org/preferences-service;1"];
    var pref = cPref.getService(ci.nsIPrefBranch2);
    var newObserver = function (handler) {
      // see: https://developer.mozilla.org/en/nsIObserver
      return {"observe": handler};
    };
    
    var RE_3RDPARTY = /^@3RDPARTY:/;
    var loadSettings = function (conf) {
      // see: https://developer.mozilla.org/en/nsIPrefBranch2
      var actionDefs = pref.getCharPref(pref_key, "").split(" ");
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
    var storeSettings = function (conf) {
      var lines = [];
      for (var key in conf) {
        var value = conf[key];
        lines.push(key + "=" + (value[1] ? "@3RDPARTY:" : "") + value[0]);
      }
      pref.setCharPref(OPTION_KEY, lines.join(" "));
    };
    
    var conf = {};
    var self = {
      load: function () {
        conf = {};
        loadSettings(conf);
      },
      save: function () {
        storeSettings(conf);
      },
      defined: function (host) {
        return conf[host] !== undefined;
      },
      set: function (host, action, only3rd) {
        conf[host] = [action, only3rd];
      },
      setAction: function (host, action) {
        var value = conf[host] || ["", false];
        value[0] = action;
        conf[host] = value;        
      },
      setOnly3rd: function (host, only3rd) {
        var value = conf[host];
        if (value) value[1] = only3rd;
      },
      remove: function (host) {
        delete conf[host];
      },
      getAction: function (host) {
        var value = conf[host];
        return value ? value[0] : null;
      },
      getOnly3rd: function (host) {
        var value = conf[host];
        return value ? value[1] : false;        
      }
    };
    
    // init
    self.load();
    var handlerSyncSettings = function (subject, topic, data) {
      self.load();
    };
    pref.addObserver(OPTION_KEY, newObserver(), false);
    
    return self;
  };
  
  // [configuration manage]
  var cPrompt = cc["@mozilla.org/embedcomp/prompt-service;1"];
  var prompt = cPrompt.getService(ci.nsIPromptService);
  
  var settings = RefControlSettings(OPTION_KEY);
  
  // [context menus]
  var menuData = [
    ["normal", "Normal", "@NORMAL"],
    ["block", "Block", ""],
    ["forge", "Forge", "@FORGE"],
  ];
  
  // UI factories
  // see: https://developer.mozilla.org/en/XUL/menu
  // see: https://developer.mozilla.org/en/XUL/menuitem
  var Widget = function (typename, opts) {
    var node = document.createElement(typename);
    for (var key in opts.props || {}) {
      node[key] = opts.props[key];
    }
    for (var key in opts.attrs || {}) {
      node.setAttribute(key, opts.attrs[key]);
    }
    return node;
  };
  var connect = function (node, events) {
    for (var key in events) {
      node.addEventListener(key, events[key], false);
    }
    return node;
  };
  var Menu = function (opts) {
    var nodeopts = {
      props: {
        id: opts.id,
        hidden: opts.hidden || false,
        className: opts.iconic ? "menu-iconic" : "menu-non-iconic"
      },
      attrs: {
        label: opts.label || ""
      }
    };
    return Widget("menu", nodeopts);
  };
  var MenuPopup = function () {
    return Widget("menupopup", {});
  };
  var MenuSep = function () {
    return Widget("menuseparator", {});
  };
  var MenuItem = function (opts) {
    var nodeopts = {
      props: {
        id: opts.id,
        hidden: opts.hidden ? true : false,
        className: opts.iconic ? "menuitem-iconic" : "menuitem-non-iconic"
      },
      attrs: {
        label: opts.label || "",
        checked: "false"
      }
    };
    return Widget("menuitem", nodeopts);
  };
  
  // event handlers
  var setMenuLabels = function () {
    var host = window.content.location.host;
    var action = settings.getAction(host);
    var only3rd = settings.getOnly3rd(host);
    var label = "\"" + host + "\"";
    domain.setAttribute("label", label);
    for (var i = 0; i < menuData.length; i += 1) {
      var data = menuData[i];
      var item = items[data[0]];
      item.setAttribute("checked", action == data[2] ? "true" : "false");
      item.host = host;
    }
    if (!!action && action[0] != "@") {
      edit.setAttribute("label", action);
      edit.setAttribute("checked", true);
    } else {
      edit.setAttribute("label", "(Edit)");
      edit.setAttribute("checked", false);
    }
    edit.host = host;
    third.setAttribute("checked", only3rd ? "true" : "false");
    third.host = host;
  };
  
  var setDefaultMenuLabels = function () {
    var host = "@DEFAULT";
    var action = settings.getAction(host);
    var only3rd = settings.getOnly3rd(host);
    for (var i = 0; i < menuData.length; i += 1) {
      var data = menuData[i];
      var item = defaultItems[data[0]];
      item.setAttribute("checked", action == data[2] ? "true" : "false");
    }
    defaultThird.setAttribute("checked", only3rd ? "true" : "false");
  };
  
  var updateActionCommand = function (item, action) {
    return function () {
      var host = item.host;
      if (item.getAttribute("checked") == "true") {
        settings.remove(host);
      } else {
        settings.setAction(host, action);
      }
      settings.save();
    };
  };
  
  var updateActionByEditCommand = function (item) {
    return function () {
      var host = item.host;
      var input = {"value": settings.getAction(host)};
      var result = prompt.prompt(
        window, "Edit referer action", "Referer URI", input, 
        "", {"checked":false});
      if (result) {
        settings.setAction(host, input.value);
        settings.save();
      }    
    };
  };
  
  var updateThirdCommand = function (item) {
    return function () {
      var host = item.host;
      if (settings.defined(host)) {
        var current = item.getAttribute("checked") == "true";
        settings.setOnly3rd(host, !current);
        settings.save();
      }
    };
  };
  
  // build UI
  var menu = Menu({
    id: "refcontrolui.menu",
    label: "Referer Control",
    iconic: true
  });
  connect(menu, {popupshowing: setMenuLabels});
  var popup = MenuPopup();
  menu.appendChild(popup);
  
  var domain = MenuItem({
    id: "refcontrolui.menu.domain",
    iconic: false
  });
  popup.appendChild(domain);
  popup.appendChild(MenuSep());
  
  var items = {};
  for (var i = 0; i < menuData.length; i += 1) {
    var data = menuData[i];
    var item = MenuItem({
      id: "refcontrolui.menu." + data[0],
      label: data[1],
      iconic: true,
    });
    connect(item, {command: updateActionCommand(item, data[2])});
    popup.appendChild(item);
    items[data[0]] = item;
  }
  
  var edit = MenuItem({
    id: "refcontrolui.menu.edit",
    label: "(Edit)",
    iconic: true
  });
  connect(edit, {command: updateActionByEditCommand(edit)});
  popup.appendChild(edit);
  popup.appendChild(MenuSep());
  
  var third = MenuItem({
    id: "refcontrolui.menu.3rd",
    label: "3rd party only",
    iconic: true
  });
  connect(third, {command: updateThirdCommand(third)});
  popup.appendChild(third);
  popup.appendChild(MenuSep());
  
  // UI for default action edit
  var defaultMenu = Menu({
    id: "refcontrolui.menu.default",
    label: "All Site",
    iconic: false
  });
  connect(defaultMenu, {popupshowing: setDefaultMenuLabels});
  popup.appendChild(defaultMenu);
  
  var defaultPopup = MenuPopup();
  defaultMenu.appendChild(defaultPopup);
  
  var defaultItems = {};
  for (var i = 0; i < menuData.length; i += 1) {
    var data = menuData[i];
    var item = MenuItem({
      id: "refcontrolui.menu.default." + data[0],
      label: data[1],
      iconic: true
    });
    connect(item, {command: updateActionCommand(item, data[2])});
    item.host = "@DEFAULT";
    defaultPopup.appendChild(item);
    defaultItems[data[0]] = item;
  }
  defaultPopup.appendChild(MenuSep());
  
  var defaultThird = MenuItem({
    id: "refcontrolui.menu.default.3rd",
    label: "3rd party only",
    iconic: true
  });
  defaultThird.host = "@DEFAULT";
  connect(defaultThird, {command: updateThirdCommand(defaultThird)});
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
