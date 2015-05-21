
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
    var deviceUUID = "2fac1234-31f8-1122-2222-08002b34c003";
    var friendlyName = "ChromeApp Player";
    var manufacturer = "ScreenCloud Player";
    var modelName = "Chrome App";
    var allowStoppable = "true";  // string only "true" or "false"
    var defaultPlayerUrl = "";
    var urlMapping;
    
    var availableApps = []; // array of registered apps / running apps

    var appConfig = {
        appId : "ScreenCloud",
        deviceUUID : "2fac1234-31f8-1122-2222-08002b34c003",
        friendlyName : "ChromeApp Player",
        manufacturer : "ScreenCloud Player",
        modelName : "Chrome App",
        allowStoppable : "true",  // string only "true" or "false"
        defaultPlayerUrl : "",
        urlMapping
    };//

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

        if( command && command.url ){
            targetURL = command.url;
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

        registerApp: function(_appId, _stoppable, _urlMapping){
            // initialize configurations

            appId = _appId;
            if(_stoppable || _stoppable == "true" || _stoppable == 1){
                allowStoppable = "true";
            }else{
                allowStoppable = "false";
            }
            urlMapping = _urlMapping;
        },

        start: function(uuid, devicename, playerUrl) {

            deviceUUID = uuid;
            friendlyName = devicename;
            defaultPlayerUrl = playerUrl;

            ////////////////////////////////////////////////
            // SSDP
            ////////////////////////////////////////////////
            // var ssdp = require('./ssdp/chrome.js');
            console.log('ssdp = ', ssdp);
            console.log("--- DialService init ---");
            // get device IP address before start any service
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

                console.log('ssdp ssdp = ', ssdp);
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
                    console.log('device = ', device );
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
                    console.log('GET OK!, ' + this.request.uri );
                    var uri = this.request.uri;

                    if( uri == "/device.description.xml"){
                        console.log("GET 200 " + uri);

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

                        var appInfo = "<?xml version='1.0' encoding='UTF-8'?> \
                    <service xmlns='urn:dial-multiscreen-org:schemas:dial'> \
                        <name>"+friendlyName+"</name> \
                        <friendlyName>"+friendlyName+"</friendlyName> \
                        <options allowStop='" + allowStoppable  + "'/> \
                        <activity-status xmlns='urn:chrome.google.com:cast'> \
                            <description>Legacy</description> \
                        </activity-status> \
                        <servicedata xmlns='urn:chrome.google.com:cast'> \
                            <connectionSvcURL></connectionSvcURL> \
                            <protocols></protocols> \
                        </servicedata> \
                        <state></state> \
                         \
                    </service>";

                        this.setHeader("Access-Control-Allow-Method", "GET, POST, DELETE, OPTIONS");
                        this.setHeader("Access-Control-Expose-Headers", "Location");
                        this.setHeader("Cache-control", "no-cache, must-revalidate, no-store");
                        this.setHeader("Application-URL", 'http://'+deviceIpAddress+':'+webServerPort+'/apps/');
                        this.setHeader("Content-Type", "application/xml;charset=utf-8");

                        this.write( appInfo );

                    }else if( uri == ("/apps/"+appId) ){
                        var appInfo = "<?xml version='1.0' encoding='UTF-8'?> \
                    <service xmlns='urn:dial-multiscreen-org:schemas:dial'> \
                        <name>"+friendlyName+"</name> \
                        <friendlyName>"+friendlyName+"</friendlyName> \
                        <options allowStop='" + allowStoppable + "'/> \
                        <activity-status xmlns='urn:chrome.google.com:cast'> \
                            <description>Legacy</description> \
                        </activity-status> \
                        <servicedata xmlns='urn:chrome.google.com:cast'> \
                            <connectionSvcURL></connectionSvcURL> \
                            <protocols></protocols> \
                        </servicedata> \
                        <state></state> \
                         \
                    </service>";

                        this.setHeader("Access-Control-Allow-Method", "GET, POST, DELETE, OPTIONS");
                        this.setHeader("Access-Control-Expose-Headers", "Location");
                        this.setHeader("Cache-control", "no-cache, must-revalidate, no-store");
                        this.setHeader("Application-URL", 'http://'+deviceIpAddress+':'+webServerPort+'/apps/');
                        this.setHeader("Content-Type", "application/xml;charset=utf-8");

                        this.write( appInfo );
                    }


                },
                post: function() {
                    // handle get request
                    // this.write('POST OK!, ' + this.request.uri)
                    console.log('POST OK!, ' + this.request.uri );

                    // console.log(
                    //   this.request.data,
                    //   this.request.getBodyAsString(),
                    //   this.request.getBodyAsJSON())

                    console.log(this.request.getBodyAsJSON() );
                    var command = this.request.getBodyAsJSON();

                    if( command.app_id == "ScreenCloud" ){
                        openAppWindow( command );
                    }
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

