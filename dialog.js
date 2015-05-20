var defaultUrl = "http://player.screencloud.io/index.html";
	var defaultFriendlyName = "ScreenCloud, Chrome app";

	var cbKeepAlwayOn;
	var cdStartAtBoot;
	var cbVisible;
	var tbDefaultUrl;
	var tbFriendlyName;
	var dialogSetting;

	var storage = chrome.storage.local;

	function saveConfig() {
		var dataObj= {};
		dataObj['KeepScreenAlwayOn'] = cbKeepAlwayOn.checked;
		dataObj['StartAtBoot'] = cdStartAtBoot.checked;
		dataObj['VisibleOnLocalNetwork'] = cbVisible.checked;
		dataObj['DefaultUrl'] = tbDefaultUrl.value;
		dataObj['FriendlyName'] = tbFriendlyName.value;
		storage.set(dataObj);//save
	}

	function populateConfig() {	
		storage.get('KeepScreenAlwayOn',function(result){
			var value = Object.keys(result).length == 0 ? true : result;
			console.log('KeepScreenAlwayOn', value);
			cbKeepAlwayOn.checked = value.KeepScreenAlwayOn;
		});

		storage.get('StartAtBoot',function(result){
			var value = Object.keys(result).length == 0 ? true : result;
			console.log('StartAtBoot', value);
			cdStartAtBoot.checked = value.StartAtBoot;
		});

		storage.get('VisibleOnLocalNetwork',function(result){
			var value = Object.keys(result).length == 0 ? true : result;
			console.log('VisibleOnLocalNetwork', value);
			cbVisible.checked = value.VisibleOnLocalNetwork;
		});

		storage.get('DefaultUrl',function(result){
			var value = Object.keys(result).length == 0 ? defaultUrl : result;
			console.log('DefaultUrl', value);
			tbDefaultUrl.value = value.DefaultUrl;
		});

		storage.get('FriendlyName',function(result){
			var value = Object.keys(result).length == 0 ? defaultFriendlyName : result;
			console.log('FriendlyName', value);
			tbFriendlyName.value = value.FriendlyName;
		});	
	}


	document.addEventListener("DOMContentLoaded", function(event) {

		//defaultValue();

		cbKeepAlwayOn = document.querySelector('#cbKeepAlwayOn');
		cdStartAtBoot = document.querySelector('#cdStartAtBoot');
		cbVisible = document.querySelector('#cbVisible');
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
	    	evt.stopPropagation();//!important
		  	dialogSetting.close();
		  	return false;
		});

	});