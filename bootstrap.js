/**
 * Copyright 2014 Alexander Salas
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.mozilla.org/MPL/2.0/

 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

"use strict";

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

Cu.import("resource:///modules/CustomizableUI.jsm");
Cu.import("resource://gre/modules/Services.jsm");

var console =
  Cu.import("resource://gre/modules/devtools/Console.jsm", {}).console;

function install(aData, aReason) {}

function uninstall(aData, aReason) {}

function startup(aData, aReason) {
  AusView.init();
}

function shutdown(aData, aReason) {
  AusView.uninit();
}

let AusView = {
  _timers : [],

  init : function() {
    let enumerator = Services.wm.getEnumerator("navigator:browser");

    while (enumerator.hasMoreElements()) {
      this.windowListener.addUI(enumerator.getNext());
    }

    Services.wm.addListener(this.windowListener);

    // create widget and add it to the main toolbar.
    CustomizableUI.createWidget(
      { id : "socialmediatext-button",
        type : "view",
        viewId : "socialmediatext-panel",
        defaultArea : CustomizableUI.AREA_NAVBAR,
        label : "Hello Button",
        tooltiptext : "Hello!",
        onViewShowing : function (aEvent) {
          let doc = aEvent.target.ownerDocument;
          // since the panelview node is moved and the iframe is reset in some
          // cases, this hack ensures that the code runs once the iframe is
          // valid.
          let timer = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);

          timer.initWithCallback(
            { notify : function() { AusView.showAudioPanel(doc); } }, 100,
            Ci.nsITimer.TYPE_ONE_SHOT);
          AusView._timers.push(timer);
        },
        onViewHiding : function (aEvent) {
          let doc = aEvent.target.ownerDocument;
          // reload the iframe so that it is reset in all cases.
          doc.getElementById("socialmediatext-iframe").webNavigation.
            reload(Ci.nsIWebNavigation.LOAD_FLAGS_NONE);
        }
      });
  },
  
  // parseUri 1.2.2
  // (c) Steven Levithan <stevenlevithan.com>
  // MIT License

  parseUri: function (str) {
  
    this.options = {
      strictMode: false,
      key: ["source","protocol","authority","userInfo","user","password","host","port","relative","path","directory","file","query","anchor"],
      q:   {
        name:   "queryKey",
        parser: /(?:^|&)([^&=]*)=?([^&]*)/g
      },
      parser: {
        strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
        loose:  /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
      }
    };  
  
    var o   = this.options,
      m   = o.parser[o.strictMode ? "strict" : "loose"].exec(str),
      uri = {},
      i   = 14;

    while (i--) uri[o.key[i]] = m[i] || "";

    uri[o.q.name] = {};
    uri[o.key[12]].replace(o.q.parser, function ($0, $1, $2) {
      if ($1) uri[o.q.name][$1] = $2;
    });

    return uri;
  },
  
  showAudioPanel : function(aDocument) {
    let contentDoc;
    let uri;
    let socialURLs = [];
    let links;
    let url;

    contentDoc = aDocument.defaultView.gBrowser.contentDocument;
    uri = aDocument.defaultView.gBrowser.currentURI.spec;
    var u = AusView.parseUri(uri), site = u.protocol + "://" + u.host;
    if (u.port && u.port.strlen) site += ":" + u.port  
	
    var htxt = null;
	var req = Components.classes["@mozilla.org/xmlextras/xmlhttprequest;1"]
                   .createInstance(Components.interfaces.nsIXMLHttpRequest);
    req.open('GET', site + "/socialmedia.txt", true);
    
    req.onreadystatechange = function () {
      if (req.readyState == 4 && req.status == 200) {
        htxt = req.responseText;
        var rps = req.getResponseHeader("Content-Type");
        if (htxt.length > 0 && rps.match("text/plain")) {
		  var links = htxt.split(/\r?\n/);
		  for (let i = 0; i < links.length; i++) {
				socialURLs.push(links[i]);
			}
			console.log("Social Media URLs found: " + socialURLs.length);

			if (0 < socialURLs.length) {
			  let socialDoc =
				aDocument.getElementById("socialmediatext-iframe").contentDocument;
			  let trackURL;
			  let favicon;


			  for (let i = 0; i < socialURLs.length; i++) {
				trackURL = socialURLs[i];
				let favicons = socialDoc.getElementById("icons");
				favicon = socialDoc.createElement("button");
				favicon.setAttribute("onclick", "openSM('"+trackURL+"');");
				favicon.style.backgroundImage = "url('http://www.google.com/s2/favicons?domain="+trackURL+"')";
				favicons.appendChild(favicon);
				console.log("Social Media URL: " + trackURL);
			  }
			}
        }         
      } else {	
        //socialmediatxtButton.collapsed = true;
      }
      
    };
    req.send(null);
  },

  uninit : function() {
    let enumerator = Services.wm.getEnumerator("navigator:browser");

    CustomizableUI.destroyWidget("socialmediatext-button");

    Services.wm.removeListener(this.windowListener);

    while (enumerator.hasMoreElements()) {
      this.windowListener.removeUI(enumerator.getNext());
    }
  },

  windowListener : {
    /**
     * Adds the panel view for the button on all windows.
     */
    addUI : function(aWindow) {
      let doc = aWindow.document;
      let panel = doc.createElement("panelview");
      let iframe = doc.createElement("iframe");

      panel.setAttribute("id", "socialmediatext-panel");
      iframe.setAttribute("id", "socialmediatext-iframe");
      iframe.setAttribute("type", "content");
      iframe.setAttribute("src", "chrome://socialmediatext/content/socialmedia.html");

      panel.appendChild(iframe);
      doc.getElementById("PanelUI-multiView").appendChild(panel);

      this._uri =
        Services.io.newURI("chrome://socialmediatext/skin/toolbar.css", null, null);
      aWindow.QueryInterface(Ci.nsIInterfaceRequestor).
        getInterface(Ci.nsIDOMWindowUtils).loadSheet(this._uri, 1);
    },

    /**
     * Removes all added UI elements.
     */
    removeUI : function(aWindow) {
      let doc = aWindow.document;
      let panel = doc.getElementById("socialmediatext-panel");

      panel.parentNode.removeChild(panel);

      aWindow.QueryInterface(Ci.nsIInterfaceRequestor).
        getInterface(Ci.nsIDOMWindowUtils).removeSheet(this._uri, 1);
    },

    onOpenWindow : function(aXULWindow) {
      // A new window has opened.
      let that = this;
      let domWindow =
        aXULWindow.QueryInterface(Ci.nsIInterfaceRequestor).
        getInterface(Ci.nsIDOMWindow);

      // Wait for it to finish loading
      domWindow.addEventListener(
        "DOMContentLoaded",
        function listener() {
          domWindow.removeEventListener("DOMContentLoaded", listener, false);
          // If this is a browser window then setup its UI
          if (domWindow.document.documentElement.getAttribute("windowtype") ==
              "navigator:browser") {
            that.addUI(domWindow);
          }
      }, false);
    },

    onCloseWindow : function(aXULWindow) {},
    onWindowTitleChange: function(aXULWindow, aNewTitle) {}
  }
};

