(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = {
	defaultDeviceFriendlyName: 'ScreenCloud, Chrome app',
	defaultPlayerUrl: 'http://player.screencloud.io/index.html'
}
},{}],2:[function(require,module,exports){
//var defaultUrl = "http://player.screencloud.io/index.html";
//var defaultFriendlyName = "ScreenCloud, Chrome app";

var config = require('./config.js');

//var cbKeepAlwayOn;
//var cdStartAtBoot;
//var cbVisible;
var tbDefaultUrl;
var tbFriendlyName;
var dialogSetting;

var storage = chrome.storage.local;

function saveConfig() {
	var dataObj= {};
	//dataObj['KeepScreenAlwayOn'] = cbKeepAlwayOn.checked;
	//dataObj['StartAtBoot'] = cdStartAtBoot.checked;
	//dataObj['VisibleOnLocalNetwork'] = cbVisible.checked;
	dataObj['DEFAULT_PLAYER_URL'] = tbDefaultUrl.value;
	dataObj['FRIENDLY_NAME'] = tbFriendlyName.value;
	storage.set(dataObj);//save
}

function populateConfig() {	
	//storage.get('KeepScreenAlwayOn',function(result){
	//	var value = Object.keys(result).length == 0 ? {'KeepScreenAlwayOn':true} : result;
	//	console.log('KeepScreenAlwayOn', value);
	//	cbKeepAlwayOn.checked = value.KeepScreenAlwayOn;
	//});
    //
	//storage.get('StartAtBoot',function(result){
	//	var value = Object.keys(result).length == 0 ? {'StartAtBoot':true} : result;
	//	console.log('StartAtBoot', value);
	//	cdStartAtBoot.checked = value.StartAtBoot;
	//});
    //
	//storage.get('VisibleOnLocalNetwork',function(result){
	//	var value = Object.keys(result).length == 0 ? {'VisibleOnLocalNetwork':true} : result;
	//	console.log('VisibleOnLocalNetwork', value);
	//	cbVisible.checked = value.VisibleOnLocalNetwork;
	//});

	//storage.get('DEFAULT_PLAYER_URL',function(result){
	//	var value = Object.keys(result).length == 0 ? {'DefaultUrl':defaultUrl} : result;
	//	console.log('DEFAULT_PLAYER_URL', value);
	//	tbDefaultUrl.value = value.DefaultUrl;
	//});
    //
	//storage.get('FRIENDLY_NAME',function(result){
	//	var value = Object.keys(result).length == 0 ? {'FriendlyName':defaultFriendlyName} : result;
	//	console.log('FRIENDLY_NAME', value);
	//	tbFriendlyName.value = value.FriendlyName;
	//});

	storage.get(['UUID', 'DEFAULT_PLAYER_URL', 'FRIENDLY_NAME'],function(result){
		tbFriendlyName.value = result.FRIENDLY_NAME || config.defaultDeviceFriendlyName;
		tbDefaultUrl.value = result.DEFAULT_PLAYER_URL || config.defaultPlayerUrl;

        document.querySelector('#tbUUID').value = result.UUID || undefined;
	});
}


document.addEventListener("DOMContentLoaded", function(event) {

	//defaultValue();

	//cbKeepAlwayOn = document.querySelector('#cbKeepAlwayOn');
	//cdStartAtBoot = document.querySelector('#cdStartAtBoot');
	//cbVisible = document.querySelector('#cbVisible');

	tbDefaultUrl = document.querySelector('#tbDefaultUrl');
	tbFriendlyName = document.querySelector('#tbFriendlyName');
	dialogSetting = document.querySelector('#dialogSetting');

    document.addEventListener("click", function(e){
    	if (dialogSetting.open == false){ 
    		populateConfig();
    		dialogSetting.showModal();
    	}
    });

    document.querySelector('#close').addEventListener("click", function(evt) {
    	evt.stopPropagation();//!important
	  	dialogSetting.close();
	  	return false;
	});

	document.querySelector('#save').addEventListener("click", function(evt) {
    	saveConfig();

        //TODO reload webview and ssdp service to apply new value
        document.querySelector('webview').src = tbDefaultUrl.value;

    	evt.stopPropagation();//!important
	  	dialogSetting.close();
	  	return false;
	});

});

// fullscreen the current window at startup.
onload = function() {
	//chrome.app.window.current().fullscreen();
}

},{"./config.js":1}]},{},[2]);
