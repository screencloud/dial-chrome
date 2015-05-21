/**
 * Listens for the app launching then creates the window
 *
 * @see http://developer.chrome.com/apps/app.runtime.html
 * @see http://developer.chrome.com/apps/app.window.html
 */



var DialService = require('./dialService.js');
var dialService = new DialService();
var config = require('./config.js');
var windowManager = require('./windowManager');
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

// var windowManager = {
//     openAppWindow: function( command ){
//         console.log('windowManager: openAppWindow', command);
//         console.log('total app windows = ', chrome.app.window.getAll().length );

//         var targetURL = defaultPlayerUrl;
//         var screenWidth = Math.round(window.screen.availWidth*1.0);
//         var screenHeight = Math.round(window.screen.availHeight*1.0);
//         var width = Math.round(screenWidth*0.5);
//         var height = Math.round(screenHeight*0.5);

//         console.log("screen size = ", width);

//         if( command ){
//             targetURL = command;
//         }

//         chrome.app.window.create(
//             'window.html',
//             {
//                 id:"ScreenCloudPlayer",
//                 outerBounds: {
//                     width: width,
//                     height: height,
//                     left: Math.round((screenWidth-width)/2),
//                     top: Math.round((screenHeight-height)/2)
//                 },
//                 hidden: true  // only show window when webview is configured
//             },
//             function(appWin) {
//                 console.log('update command url');

//                 var updateWebviewURL = function(targetURL){
//                     var webview = appWin.contentWindow.document.querySelector('webview');
//                     if(webview){
//                         webview.src = targetURL;
//                         console.log('config.k_LATEST_URL =', config.k_LATEST_URL);
//                         var dataObject = {};
//                         dataObject[config.k_LATEST_URL] = targetURL;
//                         config.saveConfig( dataObject );
//                         console.log('open targetURL = ' + targetURL );
//                         appWin.show();
//                     }
//                 }

//                 appWin.contentWindow.addEventListener('DOMContentLoaded',
//                     function(e) {
//                         // when window is loaded, set webview source
//                         updateWebviewURL(targetURL);
//                     }
//                 );
//                 // this for execute later when get called to change content url
//                 updateWebviewURL( targetURL );

//             }.bind(this)
//         );
//     }
// }

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

    
    
    var screenCloudPlayer = {
                                appId : "ScreenCloud",
                                defaultPlayerUrl : defaultPlayerUrl,
                                urlMapping : function(arg){
                                    return JSON.parse(arg).url;
                                },
                                allowStoppable : "true"
                            }
    dialService.registerApp(screenCloudPlayer);

    

    // start dial service
    // uuid, devicename, playerUrl, mfacturer, mName) {
    dialService.start(uuid, deviceName, defaultPlayerUrl, 'ScreenCloud factory', 'ChromeApp Model', windowManager);

});
