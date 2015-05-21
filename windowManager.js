var config = require('./config.js');

module.exports = {
    openAppWindow: function( command ){
        console.log('windowManager: openAppWindow', command);
        console.log('total app windows = ', chrome.app.window.getAll().length );
        
        var targetURL = "";
        var screenWidth = Math.round(window.screen.availWidth*1.0);
        var screenHeight = Math.round(window.screen.availHeight*1.0);
        var width = Math.round(screenWidth*0.5);
        var height = Math.round(screenHeight*0.5);

        console.log("screen size = ", width);

        if( command ){
            targetURL = command;
        }

        chrome.app.window.create(
            'window.html',
            {
                id:"ScreenCloudPlayer",
                outerBounds: {
                    width: width,
                    height: height,
                    left: Math.round((screenWidth-width)/2),
                    top: Math.round((screenHeight-height)/2)
                },
                hidden: true  // only show window when webview is configured
            },
            function(appWin) {
                console.log('update command url');

                var updateWebviewURL = function(targetURL){
                    var webview = appWin.contentWindow.document.querySelector('webview');
                    if(webview){
                        webview.src = targetURL;
                        console.log('config.k_LATEST_URL =', config.k_LATEST_URL);
                        var dataObject = {};
                        dataObject[config.k_LATEST_URL] = targetURL;
                        config.saveConfig( dataObject );
                        console.log('open targetURL = ' + targetURL );
                        appWin.show();
                    }
                }

                appWin.contentWindow.addEventListener('DOMContentLoaded',
                    function(e) {
                        // when window is loaded, set webview source
                        updateWebviewURL(targetURL);
                    }
                );
                // this for execute later when get called to change content url
                updateWebviewURL( targetURL );

            }.bind(this)
        );
    }
};