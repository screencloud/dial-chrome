/**
 * Listens for the app launching then creates the window
 *
 * @see http://developer.chrome.com/apps/app.runtime.html
 * @see http://developer.chrome.com/apps/app.window.html
 */

var DialService = require('./dialService.js');
var config = require('./config.js');
var dialService = new DialService();
var defaultPlayerUrl = "";

function genGuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c === 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
}

function saveUuid(uuid) {
	chrome.storage.local.set({'UUID':uuid}); // save
}

// get config
chrome.storage.local.get(['UUID', 'FRIENDLY_NAME', 'DEFAULT_PLAYER_URL', 'LATEST_URL'], function(result){

	var uuid = result.UUID || undefined;
	if (uuid == undefined) {
		uuid = genGuid(); // gen uuid & save
		saveUuid(uuid);
	}

    var deviceName = result.FRIENDLY_NAME || config.friendlyName;

    this.defaultPlayerUrl =  result.DEFAULT_PLAYER_URL || config.defaultPlayerUrl;
    this.defaultPlayerUrl = result.LATEST_URL || this.defaultPlayerUrl;

    console.log('defaultPlayerUrl--->'+this.defaultPlayerUrl);

    initPlayer(this.defaultPlayerUrl);

    // start dial service
    // dialService.start(uuid, deviceName, defaultPlayerUrl);

}.bind(this));




//document.addEventListener('DOMContentLoaded',
//    function(e) {
//        // when window is loaded, set webview source
//        var webview = document.querySelector('webview');
//        webview.src = 'http://youtube.com';
//
//        console.log('open targetURL' );
//        // now we can show it:
//        //appWin.show();
//    }
//);


// function reload() { chrome.runtime.reload() }

function initPlayer(targetURL) {
    //chrome.app.runtime.onLaunched.addListener(function(o) {

    // Center window on screen.
    console.log('initPlayer : ', targetURL);
    console.log('initPlayer this.defaultPlayerUrl', this.defaultPlayerUrl );
    var screenWidth = Math.round(window.screen.availWidth * 1.0);
    var screenHeight = Math.round(window.screen.availHeight * 1.0);
    var width = Math.round(screenWidth * 0.5);
    var height = Math.round(screenHeight * 0.5);
    var newURL = this.defaultPlayerUrl;

    chrome.app.window.create(
        'window.html',
        {
            id: "ScreenCloudPlayer",
            outerBounds: {
                width: width,
                height: height,
                left: Math.round((screenWidth - width) / 2),
                top: Math.round((screenHeight - height) / 2)
            },
            hidden: true
        },
        function (appWin) {
            console.log('$$$$$$$$update command url');
            console.log('appWin', appWin);

            appWin.contentWindow.addEventListener('DOMContentLoaded',
                function (e) {
                    // when window is loaded, set webview source
                    var webview = appWin.contentWindow.document.querySelector('webview');

                    webview.src = this.defaultPlayerUrl;
                    console.log("newURL", newURL);
                    console.log('open this.defaultPlayerUrl', this.defaultPlayerUrl );
                    // now we can show it:
                    appWin.show();
                }.bind(this)
            );

            //var webview = appWin.contentWindow.document.querySelector('webview');
            //console.log('webview----->' + webview);
            //if (webview) {
            //
            //
            //    webview.src = 'http://www.google.com';
            //    //chrome.storage.local.set({LATEST_URL: targetURL}); // save latest url
            //    //
            //    //console.log('open targetURL', targetURL );
            //    // now we can show it:
            //    //appWin.show();
            //}

        }.bind(this) );

    // start dial service
    // dialService.start(uuid, deviceName, defaultPlayerUrl);
    //});
}

// function genGuid() {
//     return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
//         var r = Math.random()*16|0, v = c === 'x' ? r : (r&0x3|0x8);
//         return v.toString(16);
//     });
// }

// function saveUuid(uuid) {
// 	chrome.storage.local.set({'uuid':uuid}); // save
// }

// // get config
// chrome.storage.local.get(['uuid', 'FriendlyName'], function(config){

// 	var uuid = config.uuid || undefined;
// 	if (uuid == undefined) uuid = genGuid();
//   saveUuid(uuid);

//   var firndlyName = config.FriendlyName || var friendlyName = "ChromeApp Player";

//   // console.log('uuid=='+uuid);

//   dialService.start(config);

// 	// console.log('dialService', dialService);
// });

// chrome.app.window.current().fullscreen();