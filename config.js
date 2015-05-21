module.exports = {
	k_UUID:"UUID",
	k_FRIENDLY_NAME:"FRIENDLY_NAME",
	k_DEFAULT_PLAYER_URL:"DEFAULT_PLAYER_URL",
	k_LATEST_URL:"LATEST_URL",

	defaultDeviceFriendlyName: 'ScreenCloud, Chrome app',
	defaultPlayerUrl: 'http://player.screencloud.io/index.html',
	

	saveConfig: function(dataObj) {
		console.log('saveConfig ', dataObj );
		var storage = chrome.storage.local;
		storage.set( dataObj );
	}
}