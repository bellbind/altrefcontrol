// ==UserScript==
// @name refcontrol.uc.js 
// @include main
// @description Control referer sending by refControl addon settings
// @version 0.3
// @author bellbind
// @license MPL 1.1/GPL 2.0/LGPL 2.1
// @homepage https://gist.github.com/777814
// ==/UserScript==
/* Usage
 * - Install userchromejs addon and this script into firefox 3.x or 4.x
 * - Set "refcontrol.actions" value by "about:config"
 *
 * Example value of refcontrol.actions
 *   "@DEFAULT=@FORGE image.itmedia.co.jp=http://www.itmedia.co.jp/"
 */
(function(){
  //{key: [action, only3rd]}: derived from "refcontrol.actions"
  //  for spec, see: http://www.stardrifter.org/refcontrol/
  //[refcontrol key]
  //  hostname:
  //  @DEFAULT: any not specified
  //[refControl action]
  //  @NORMAL : not modified
  //  @FORGE : set referer as the uri host
  //  (empty text): block referer
  //  any uri : set referer as the uri
  //  @3RDPARTY:anyaction : the action applied only 3rd party request
  //[extended action]
  //  @BLOCK : block referer (same as empty)
  //  @FORCE : force send origin
  //  @SELF : referer as same uri
  var defaultConf = {
    "@DEFAULT": ["@FORGE", false]
  };
  
  var OPTION_KEY = "refcontrol.actions";
  var RE_3RDPARTY = /^@3RDPARTY:/;
  
  var cc = Components.classes;
  var ci = Components.interfaces;
  
  var cPref = cc["@mozilla.org/preferences-service;1"];
  var pref = cPref.getService(ci.nsIPrefBranch2);
  var cObservable = cc["@mozilla.org/observer-service;1"];
  var observable = cObservable.getService(ci.nsIObserverService);
  var newObserver = function (handler) {
    // see: https://developer.mozilla.org/en/nsIObserver
    return {"observe": handler};
  };
  
  var conf = {};
  
  var readOptions = function (conf) {
    // see: https://developer.mozilla.org/en/nsIPrefBranch2
    var actionDefs = pref.getCharPref(OPTION_KEY).split(" ");
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
  
  var updateConf = function () {
    conf = {};
    for (var key in defaultConf) conf[key] = defaultConf[key];
    readOptions(conf);
  };
  
  var handlerSyncOptions = function (subject, topic, data) {
    updateConf();
  };
  
  var resolveAction = function (conf, target, origin) {
    var is3rd = origin.protocol != "http:" || target.host != origin.host;
    var names = target.host.split(".");
    var action = "@NORMAL";
    for (var index = names.length; index >= 0; index -= 1) {
      var key = names.slice(index).join(".") || "@DEFAULT";
      var value = conf[key];
      if (value !== undefined && (!value[1] || is3rd)) action = value[0];
    }
    return action;
  };
  
  var actionToReferer = function (action, target, origin) {
    // see: https://developer.mozilla.org/en/XPCOM_Interface_Reference/nsIURI
    switch (action) {
    case "@NORMAL":
      return undefined;
    case "": case "@BLOCK":
      return null;
    case "@FORGE":
      return target.scheme + "://" + target.hostPort + "/";
    case "@FORCE":
      return origin.href;
    case "@SELF":
      return target.spec;
    }
    if (action.match(/^@/)) return undefined;
    return action;
  }
  
  var handlerRefControl = function(subject, topic, data) {
    // see: https://developer.mozilla.org/en/nsIHttpChannel
    var http = subject.QueryInterface(ci.nsIHttpChannel);
    var target = http.URI;
    var origin = window.content.document.location;
    var action = resolveAction(conf, target, origin);
    var ref = actionToReferer(action, target, origin);
    if (ref !== undefined) http.setRequestHeader("Referer", ref, false);
  };
  
  var init = function () {
    // see: https://developer.mozilla.org/en/nsIPrefBranch2
    // see: https://developer.mozilla.org/en/nsIObserverService
    // see: https://developer.mozilla.org/en/Observer_Notifications
    updateConf();
    pref.addObserver(OPTION_KEY, newObserver(handlerSyncOptions), false);
    observable.addObserver(
      newObserver(handlerRefControl), "http-on-modify-request", false);
  };
  
  init();
})();

//[changelog]
//0.3
//  * Observe pref modification: e.g. edit via about:config
//  * @SELF
//0.2
//  * 3RDPARTY: prefix
//  * Resolve suffix domain
//  * Use refControl addon pref setting
//  * @FORCE
//0.1
//  * refControl emulation for userChrome.js script
