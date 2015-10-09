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

	dataObj[ config.k_DEFAULT_PLAYER_URL ] = tbDefaultUrl.value;
	dataObj[ config.k_FRIENDLY_NAME ] = tbFriendlyName.value;
	storage.set(dataObj);//save
}

function populateConfig() {	
	storage.get([config.k_UUID, config.k_FRIENDLY_NAME, config.k_DEFAULT_PLAYER_URL],function(result){

		tbFriendlyName.value = result[config.k_FRIENDLY_NAME] || config.defaultDeviceFriendlyName;
		tbDefaultUrl.value = result[config.k_DEFAULT_PLAYER_URL] || config.defaultPlayerUrl;
        document.querySelector('#tbUUID').value = result[config.k_UUID] || undefined;
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
	// chrome.app.window.current().fullscreen();
}
