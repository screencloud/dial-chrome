/**
 * Listens for the app launching then creates the window
 *
 * @see http://developer.chrome.com/apps/app.runtime.html
 * @see http://developer.chrome.com/apps/app.window.html
 */



var DialService = require('./dialService.js');
var dialService = new DialService();
var config = require('./config.js');
var defaultPlayerUrl = "";
var savedConfig;

function genGuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c === 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
}

function saveConfig(key, value) {
	chrome.storage.local.set({key:value}); // save
}

// get config
chrome.storage.local.get([config.k_UUID, config.k_FRIENDLY_NAME, config.k_DEFAULT_PLAYER_URL, config.k_LATEST_URL], function(result){
    savedConfig = result;
    var uuid = savedConfig[config.k_UUID];

    console.log('uuid = ' + uuid );

	if (uuid == undefined) {
		uuid = genGuid(); // gen uuid & save
		saveConfig(config.k_UUID, uuid);
	}

    var deviceName = savedConfig[config.k_FRIENDLY_NAME] || config.defaultDeviceFriendlyName;
    defaultPlayerUrl = savedConfig[config.k_LATEST_URL] || defaultPlayerUrl;

    console.log('defaultPlayerUrl--->'+defaultPlayerUrl);

    // start dial service
    dialService.start(uuid, deviceName, defaultPlayerUrl);

});
