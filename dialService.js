
module.exports = (function(){

  var ssdp = require('./ssdp/chrome.js');
  var deviceIpAddress = "0.0.0.0";
  var webServerPort = 1999;
  var WebServerChrome = require('web-server-chrome');
  var WebApplication = WebServerChrome.Server; 
  var deviceUUID = "2fac1234-31f8-3344-2222-08002b34c003";
  var friendlyName = "ChromeApp Player";
  var appWindow = undefined;

  function DialService() {
      // this.exampleProp = undefined;
  }

  function _stringToArrayBuffer(str, callback) {
    var bb = new Blob([str]);
    var f = new FileReader();
    f.onload = function(e) {
        callback(e.target.result);
    };
    f.readAsArrayBuffer(bb);
  }

  function openAppWindow(command){
    console.log('openAppWindow', command);
    console.log('total app windows = ', chrome.app.window.getAll().length );

    // if( chrome.app.window.getAll().length == 0 ){

      var targetURL = "http://player.screencloud.io";
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

         appWin.contentWindow.addEventListener('DOMContentLoaded',
           function(e) {
             // when window is loaded, set webview source
             var webview = appWin.contentWindow.
                  document.querySelector('webview');
             webview.src = targetURL;
             console.log('open targetURL', targetURL );
             // now we can show it:
             appWin.show();

            

           }
         );


        var webview = appWin.contentWindow.
                  document.querySelector('webview');
        if(webview){
          webview.src = targetURL;
          console.log('open targetURL', targetURL );
          // now we can show it:
          appWin.show();
        }

       });

    // }else{
    //   var appWindows = chrome.app.window.getAll();
    //   for (var i = 0; i < appWindows.length; i++) {
    //     var appWindow = appWindows[i];
    //     appWindow.close();
    //   };

    //   openAppWindow( command );
    // }
  }
  function _validateIPaddress(ipaddress)   
  {  
   if (/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ipaddress))  
    {  
      return (true)  
    }  
    return (false)  
  } 

  DialService.prototype = {
    start: function() {

      ////////////////////////////////////////////////
      // SSDP
      ////////////////////////////////////////////////
      // var ssdp = require('./ssdp/chrome.js');
      console.log('ssdp = ', ssdp);
      console.log("--- DialService init ---");
      // get device IP address before start any service
      chrome.system.network.getNetworkInterfaces(function(interfaces){

        for (var i = 0; i < interfaces.length; i++) {
          var interfaceObj = interfaces[i]
          if( interfaceObj.address && _validateIPaddress(interfaceObj.address )){
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
                            <manufacturer>ScreenCloud, Chrome App</manufacturer> \
                            <modelName>Retina</modelName> \
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
                        <options allowStop='true'/> \
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

              }else if( uri == "/apps/ScreenCloud"){
                var appInfo = "<?xml version='1.0' encoding='UTF-8'?> \
                    <service xmlns='urn:dial-multiscreen-org:schemas:dial'> \
                        <name>"+friendlyName+"</name> \
                        <friendlyName>"+friendlyName+"</friendlyName> \
                        <options allowStop='true'/> \
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

    }

  }
  
  return DialService;

})();

