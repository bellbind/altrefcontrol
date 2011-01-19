// ==UserScript==
// @name refcontrolui.uc.js 
// @include main
// @include chrome://browser/content/browser.xul
// @description Interface for refcontrol.uc.js
// @version 0.4
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
  var clearChild = function (node) {
    while (node.hasChildNodes()) {
      node.removeChild(node.lastChild);
    }
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
  var setMenuLabels = function (host, label, ui) {
    var action = settings.getAction(host);
    var only3rd = settings.getOnly3rd(host);
    ui.domain.setAttribute("label", label);
    for (var i = 0; i < menuData.length; i += 1) {
      var data = menuData[i];
      var item = ui.items[data[0]];
      item.setAttribute("checked", action == data[2] ? "true" : "false");
      item.host = host;
    }
    if (!!action && action[0] != "@") {
      ui.edit.setAttribute("label", action);
      ui.edit.setAttribute("checked", true);
    } else {
      ui.edit.setAttribute("label", "(Edit)");
      ui.edit.setAttribute("checked", false);
    }
    ui.edit.host = host;
    ui.third.setAttribute("checked", only3rd ? "true" : "false");
    ui.third.host = host;
  };
  var setTargetMenuLabels = function () {
    var host = window.content.location.host;
    var label = "\"" + host + "\"";
    var ui = target;
    setMenuLabels(host, label, ui);
  };
  var setAllsiteMenuLabels = function () {
    var host = "@DEFAULT";
    var label = "All Site";
    var ui = allsite;
    setMenuLabels(host, label, ui);    
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
        window, "Edit referer action for \"" + host + "\"", 
        "Referer URI", input, "", {"checked":false});
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
  
  var setDomainsMenus = function () {
    clearChild(domainsPopup);
    
    var names = window.content.location.host.split(".");
    for (var i = 1; i < names.length; i += 1) {
      var host = names.slice(i).join(".");
      var label = "\"" + host + "\"";
      var ui = domainMenus("refcontrolui.menu.domains." + i, label, MenuItem);
      domainsPopup.appendChild(MenuSep());
      domainsPopup.appendChild(ui.domain);
      domainsPopup.appendChild(MenuSep());
      for (var j = 0; j < ui.actions.length; j += 1) {
        domainsPopup.appendChild(ui.actions[j]);
      }
      domainsPopup.appendChild(ui.edit);
      domainsPopup.appendChild(MenuSep());
      domainsPopup.appendChild(ui.third);
      domainsPopup.appendChild(MenuSep());
      setMenuLabels(host, label, ui);
    };
  };
  
  // builder
  var domainMenus = function (idprefix, label, domainFactory) {
    var domain = domainFactory({
      id: idprefix + ".domain",
      label: label,
      iconic: false
    });
    
    var items = {};
    var actions = [];
    for (var i = 0; i < menuData.length; i += 1) {
      var data = menuData[i];
      var item = MenuItem({
        id: idprefix + "." + data[0],
        label: data[1],
        iconic: true,
      });
      connect(item, {command: updateActionCommand(item, data[2])});
      items[data[0]] = item;
      actions.push(item);
    }
    
    var edit = MenuItem({
      id: idprefix + ".edit",
      label: "(Edit)",
      iconic: true
    });
    connect(edit, {command: updateActionByEditCommand(edit)});
    
    var third = MenuItem({
      id: idprefix + ".3rd",
      label: "3rd party only",
      iconic: true
    });
    connect(third, {command: updateThirdCommand(third)});
    
    return {
      domain: domain,
      items: items,
      actions: actions,
      edit: edit,
      third: third
    };
  };
  
  // build UI
  var menu = Menu({
    id: "refcontrolui.menu",
    label: "Referer Control",
    iconic: true
  });
  var popup = MenuPopup();
  connect(popup, {popupshowing: setTargetMenuLabels});
  menu.appendChild(popup);
  
  var target = domainMenus("refcontrolui.menu", "", MenuItem);
  popup.appendChild(target.domain);
  popup.appendChild(MenuSep());
  for (var i = 0; i < target.actions.length; i += 1) {
    popup.appendChild(target.actions[i]);
  }
  popup.appendChild(target.edit);
  popup.appendChild(MenuSep());
  popup.appendChild(target.third);
  popup.appendChild(MenuSep());
  
  var domains = Menu({
    id: "refcontrolui.menu.domains",
    label: "Domains",
    iconic: false
  });
  popup.appendChild(domains);
  popup.appendChild(MenuSep());
  var domainsPopup = MenuPopup();
  domains.appendChild(domainsPopup);
  connect(domainsPopup, {popupshowing: setDomainsMenus});
  
  // UI for all site action edit
  var allsite = domainMenus("refcontrolui.menu.default", "All Site", Menu);
  popup.appendChild(allsite.domain);
  allsite.popup = MenuPopup();
  connect(allsite.popup, {popupshowing: setAllsiteMenuLabels});
  allsite.domain.appendChild(allsite.popup);
  for (var i = 0; i < allsite.actions.length; i += 1) {
    allsite.popup.appendChild(allsite.actions[i]);
  }
  allsite.popup.appendChild(allsite.edit);
  allsite.popup.appendChild(MenuSep());
  allsite.popup.appendChild(allsite.third);
  
  // see: https://developer.mozilla.org/ja/XUL/PopupGuide/Extensions
  var contextMenu = document.getElementById("contentAreaContextMenu");
  contextMenu.appendChild(menu);
})();

//[changelog]
//0.4
//  * set popupshowing handler to its menupopup directly
//0.3
//  * Domain Editor Menu
//  * refactoring codes
//0.2
//  * Add Referer Edit UI
//0.1
//  * UI as context menu
//  * Edit only refControl compatible area
