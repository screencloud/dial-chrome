var WebServerChrome = require('web-server-chrome');
var WebApplication = WebServerChrome.Server;


module.exports = (function(){

    function WebServer() {
        // this.exampleProp = undefined;
        
        this.availableApps = {};
        this.deviceIpAddress = "0.0.0.0";
        this.webServerPort = 1999;

        this.deviceUUID = "";
        this.friendlyName = "";
        this.defaultPlayerUrl = "";
        this.manufacturer = "";
        this.modelName = "";
    }

    WebServer.prototype = {

        start:function(availableApps, deviceIpAddress, webServerPort){

            this.availableApps = availableApps;
            this.deviceIpAddress = deviceIpAddress;
            this.webServerPort = webServerPort;


            console.log('-- startWebServer ---');
            var connectedSocketId = this.socketId;
            console.log('startWebServer socketId ', this.socketId);
            console.log('this.deviceIpAddress = ', this.deviceIpAddress );
            console.log('this.friendlyName = ', this.friendlyName );
            console.log('this.deviceUUID = ', this.deviceUUID );
            console.log('this.manufacturer = ', this.manufacturer );
            console.log('this.modelName = ', this.modelName );
            console.log('this.defaultPlayerUrl = ', this.defaultPlayerUrl );

            var localThis = this;

            var mainHandler = WebServerChrome.HandlerFactory({
                get: function() {
                    // handle get request
                    // this.write('GET OK!, ' + this.request.uri)
                    if(!availableApps){
                        console.log('availableApps is null', availableApps);
                        return;
                    }                    

                    if(!localThis.friendlyName || localThis.friendlyName == undefined){
                        localThis.friendlyName = "no friendlyName"
                    }
                    
                    console.log('localThis.friendlyName = ', localThis.friendlyName );
                    console.log('----- with this ------');
                    console.log('this.deviceIpAddress = ', this.deviceIpAddress );
                    console.log('this.friendlyName = ', this.friendlyName );
                    console.log('this.deviceUUID = ', this.deviceUUID );
                    console.log('this.manufacturer = ', this.manufacturer );
                    console.log('this.modelName = ', this.modelName );
                    console.log('this.defaultPlayerUrl = ', this.defaultPlayerUrl );
                    console.log('----- without this ------');
                    console.log('deviceIpAddress = ', deviceIpAddress );
                    
                    console.log('deviceUUID = ', deviceUUID );
                    console.log('manufacturer = ', manufacturer );
                    console.log('modelName = ', modelName );
                    console.log('defaultPlayerUrl = ', defaultPlayerUrl );
                    console.log('friendlyName = ', friendlyName );

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
                                                    <friendlyName>'+localThis.friendlyName+'</friendlyName> \
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
                        console.log('============================ URI = /apps ==========================');
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
                    console.log('request.path', this.request.path);
                    console.log('POST OK!, ' + this.request.uri );
                    console.log('POST Body, ' + this.request.getBodyAsString() );

                    var appId = this.request.path.split('/apps/')[1].split('/')[0]
                    console.log('appId = ' + appId);

                    var appConfig = getApp(appId);

                    var url = appConfig.urlMapping(this.request.getBodyAsString());
                    windowManager.openAppWindow( url );

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

            this.app = new WebApplication({handlers:handlers, port:this.webServerPort, host:this.deviceIpAddress});
            var result = this.app.start(function(error, socketId){
                console.log("start callback", error, socketId);
                // this.socketId = socketId;
                // console.log('update callback this.socketId ', this.socketId);
            }.bind(this));
            console.log(result);
        }
    }

    return WebServer;

})();
