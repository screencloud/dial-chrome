
module.exports = (function(){

    var Util = require('./util.js');
    var util = new Util();

    var ssdp = require('ssdp/chrome.js');
    var config = require('./config.js');
    
    // Web Server
    var deviceIpAddress = "0.0.0.0";
    var webServerPort = 1999;
    var WebServerChrome = require('web-server-chrome');
    var WebApplication = WebServerChrome.Server;

    // Dial device details
    var appId = "ScreenCloud";
    // overall config for Dial service
    var deviceUUID = "2fac1234-31f8-1122-2222-08002b34c003";
    var friendlyName = "ChromeApp Player";
    var manufacturer = "ScreenCloud Player";
    var modelName = "Chrome App";
    

    // base on each app config
    var defaultPlayerUrl = "";
    var urlMapping;
    var allowStoppable = "true";  // string only "true" or "false"


    var availableApps = []; // array of registered apps / running apps
    var getApp = function(id) {
            for (var i = 0; i < availableApps.length; i++) {
                var existingApp = availableApps[i];
                if( existingApp.appId == id ){
                    return existingApp;
                }
            }
        }

    function DialService() {
        // this.exampleProp = undefined;
    }

    function openAppWindow(command){
        console.log('openAppWindow', command);
        console.log('total app windows = ', chrome.app.window.getAll().length );

        // if( chrome.app.window.getAll().length == 0 ){

        var targetURL = defaultPlayerUrl;
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

            }.bind(this));
    }

    DialService.prototype = {

        registerApp: function(appConfig){
            // initialize configurations

            // var appConfig = {
            //     appId : "ScreenCloud",
            //     defaultPlayerUrl : "",
            //     urlMapping : "",
            //     allowStoppable : "true",
            //     state : "stopped"
            // };//
            console.log('registerApp : ', appConfig);
            if(appConfig.appId == "" || appConfig.appId == undefined){
                console.error("appId can not be empty, undefined.");
                return;
            }
            appConfig.defaultPlayerUrl = appConfig.defaultPlayerUrl;
            appConfig.urlMapping = appConfig.urlMapping;
            if( appConfig.state ){
                appConfig.state = appConfig.state;
            }else{
                appConfig.state = "stopped";
            }

            for (var i = 0; i < availableApps.length; i++) {
                var existingApp = availableApps[i];
                if( existingApp.appId == appConfig.appId ){
                    console.error("appId already exist in current dial service.");
                    return;
                }
            }

            // make sure appConfig.allowStoppable is set correctly
            if(appConfig.allowStoppable == "0" || appConfig.allowStoppable == 0 || appConfig.allowStoppable == false){
                appConfig.allowStoppable = "false";
            }else{
                appConfig.allowStoppable = "true";
            }

            if( !availableApps ){
                availableApps = [];
            }

            availableApps[availableApps.length] = appConfig;
            console.log('add new appConfig = ', appConfig);
            console.log('total availableApps = ' + availableApps.length );
        },



        start: function(uuid, devicename, playerUrl, mfacturer, mName) {

            deviceUUID = uuid;
            friendlyName = devicename;
            defaultPlayerUrl = playerUrl;
            manufacturer = mfacturer;
            modelName = mName;

            ////////////////////////////////////////////////
            // SSDP
            ////////////////////////////////////////////////

            console.log("--- DialService init ---");
            // get device's IP address before start any service
            chrome.system.network.getNetworkInterfaces(function(interfaces){
                console.log('util = ', util);
                for (var i = 0; i < interfaces.length; i++) {
                    var interfaceObj = interfaces[i]
                    if( interfaceObj.address && util.validateIPaddress(interfaceObj.address )){
                        deviceIpAddress = interfaceObj.address
                        console.log('Device IP-ADDRESS = ', interfaceObj.address);
                        break;
                    }
                };

                this.startWebServer();

                console.log('ssdp = ', ssdp);
                // create devices
                ssdp.createDevice({
                    uuid: deviceUUID,
                    serviceList: ['upnp:rootdevice', 'urn:dial-multiscreen-org:device:dial:1', 'urn:dial-multiscreen-org:service:dial:1'],
                    location: 'http://'+deviceIpAddress+':'+webServerPort+'/device.description.xml'
                }, function(err, device) {

                    if (err) {
                        return console.log(err);
                    }
                    device.start();
                    console.log('created device = ', device );
                });

            }.bind(this) );

            openAppWindow();
        },


        startWebServer:function(){

            console.log('-- startWebServer ---');
            var connectedSocketId = this.socketId;
            console.log('startWebServer socketId ', this.socketId);

            var localThis = this;

            var mainHandler = WebServerChrome.HandlerFactory({
                get: function() {
                    // handle get request
                    // this.write('GET OK!, ' + this.request.uri)
                    console.log('GET OK!, ' + this.request.uri + "/ availableApps = " + availableApps.length);
                    var uri = this.request.uri;

                    // if no registered app yet, do nothing
                    if( availableApps.length <= 0 ){ 
                        return; 
                    }
                    if( uri == "/device.description.xml"){
                        this.setHeader("Access-Control-Allow-Method", "GET, POST, DELETE, OPTIONS");
                        this.setHeader("Access-Control-Expose-Headers", "Location");
                        this.setHeader("Cache-control", "no-cache, must-revalidate, no-store");
                        this.setHeader("Application-URL", 'http://'+deviceIpAddress+':'+webServerPort+'/apps/');
                        this.setHeader("Content-Type", "application/xml;charset=utf-8");

                        var responseMsg = '<?xml version="1.0" encoding="utf-8"?> \
                                            <root xmlns="urn:schemas-upnp-org:device-1-0"> \
                                                <specVersion> \
                                                <major>1</major> \
                                                <minor>0</minor> \
                                                </specVersion> \
                                                <URLBase>http://'+deviceIpAddress+':'+webServerPort+'/apps/</URLBase> \
                                                <device> \
                                                    <deviceType>urn:dial-multiscreen-org:device:dial:1</deviceType> \
                                                    <friendlyName>'+friendlyName+'</friendlyName> \
                                                    <manufacturer>'+manufacturer+'</manufacturer> \
                                                    <modelName>'+modelName+'</modelName> \
                                                    <UDN>uuid:' + deviceUUID + '</UDN> \
                                                    <serviceList> \
                                                        <service> \
                                                            <serviceType>urn:schemas-upnp-org:service:dial:1</serviceType> \
                                                            <serviceId>urn:upnp-org:serviceId:dial</serviceId> \
                                                            <controlURL>/ssdp/notfound</controlURL> \
                                                            <eventSubURL>/ssdp/notfound</eventSubURL> \
                                                            <SCPDURL>/ssdp/notfound</SCPDURL> \
                                                        </service> \
                                                    </serviceList> \
                                                </device> \
                                            </root>';

                        this.write( responseMsg );

                    }else if( uri == "/apps"){
                        
                        // loop return all available apps
                        for (var i = 0; i < availableApps.length; i++) {
                            var appConfig = availableApps[i];
                            var appInfo = "<?xml version='1.0' encoding='UTF-8'?> \
                                            <service xmlns='urn:dial-multiscreen-org:schemas:dial'> \
                                                <name>"+appConfig.appId+"</name> \
                                                <friendlyName>"+appConfig.appId+"</friendlyName> \
                                                <options allowStop='" + appConfig.allowStoppable  + "'/> \
                                                <activity-status xmlns='urn:chrome.google.com:cast'> \
                                                    <description>Legacy</description> \
                                                </activity-status> \
                                                <servicedata xmlns='urn:chrome.google.com:cast'> \
                                                    <connectionSvcURL></connectionSvcURL> \
                                                    <protocols></protocols> \
                                                </servicedata> \
                                                <state>"+appConfig.state+"</state> \
                                                 \
                                            </service>";

                            this.setHeader("Access-Control-Allow-Method", "GET, POST, DELETE, OPTIONS");
                            this.setHeader("Access-Control-Expose-Headers", "Location");
                            this.setHeader("Cache-control", "no-cache, must-revalidate, no-store");
                            this.setHeader("Application-URL", 'http://'+deviceIpAddress+':'+webServerPort+'/apps/');
                            this.setHeader("Content-Type", "application/xml;charset=utf-8");

                            this.write( appInfo );
                        };
                        
                    }else if( uri.indexOf("/apps/") > -1 ){
                        var appUri = uri;
                        console.log('request uri = ' + uri);
                        for (var i = 0; i < availableApps.length; i++) {
                            var appConfig = availableApps[i];

                            if( appUri == ("/apps/"+appConfig.appId) ){
                                console.log('match apps = ', appConfig );
                                var appInfo = "<?xml version='1.0' encoding='UTF-8'?> \
                                                <service xmlns='urn:dial-multiscreen-org:schemas:dial'> \
                                                    <name>"+appConfig.appId+"</name> \
                                                    <friendlyName>"+appConfig.appId+"</friendlyName> \
                                                    <options allowStop='" + appConfig.allowStoppable + "'/> \
                                                    <activity-status xmlns='urn:chrome.google.com:cast'> \
                                                        <description>Legacy</description> \
                                                    </activity-status> \
                                                    <servicedata xmlns='urn:chrome.google.com:cast'> \
                                                        <connectionSvcURL></connectionSvcURL> \
                                                        <protocols></protocols> \
                                                    </servicedata> \
                                                    <state>"+appConfig.state+"</state> \
                                                     \
                                                </service>";

                                this.setHeader("Access-Control-Allow-Method", "GET, POST, DELETE, OPTIONS");
                                this.setHeader("Access-Control-Expose-Headers", "Location");
                                this.setHeader("Cache-control", "no-cache, must-revalidate, no-store");
                                this.setHeader("Application-URL", 'http://'+deviceIpAddress+':'+webServerPort+'/apps/');
                                this.setHeader("Content-Type", "application/xml;charset=utf-8");

                                this.write( appInfo );
                                break;
                            }
                        };
                    // }else if( uri == ("/apps/"+appId) ){
                        
                    }


                },


                post: function() {
                    // handle get request
                    // this.write('POST OK!, ' + this.request.uri)
                    console.log('request.path', this.request.path);
                    console.log('POST OK!, ' + this.request.uri );
                    console.log('POST Body, ' + this.request.getBodyAsString() );

                    // console.log(
                    //   this.request.data,
                    //   this.request.getBodyAsString(),
                    //   this.request.getBodyAsJSON())

                    // console.log(this.request.getBodyAsJSON() );
                    // var command = this.request.getBodyAsJSON();

                    // if( command.app_id == "ScreenCloud" ){
                    //     openAppWindow( command );
                    // }
                    var appId = this.request.path.split('/apps/')[1].split('/')[0]
                    console.log('appId = ' + appId);

                    var appConfig = getApp(appId);

                    var url = appConfig.urlMapping(this.request.getBodyAsString());
                    openAppWindow( url );

                    appConfig.state = 'running';

                    this.setHeader("Location", "http://"+deviceIpAddress+":"+webServerPort+"/apps/"+appId+"/web-1");
                    this.write(" ", 201);

                },
                head: function() {
                    console.log('head', this.request);
                }
            });

            var handlers = [
                ['.*', mainHandler]
            ];

            this.app = new WebApplication({handlers:handlers, port:webServerPort, host:deviceIpAddress});
            var result = this.app.start(function(error, socketId){
                console.log("start callback", error, socketId);
                // this.socketId = socketId;
                // console.log('update callback this.socketId ', this.socketId);
            }.bind(this));
            console.log(result);
        },

        stop:function(){
            this.stop();
        }

    }

    return DialService;

})();

