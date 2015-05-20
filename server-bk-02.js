// fullscreen the current window at startup.
onload = function() {
  var $ = function(sel) {
    return document.querySelector(sel);
  };

  var webView=$('#wv1');

  var logEl=$('textarea');

  function log(str) {
    //logEl.value = str+"\n"+logEl.value;
  }

  log('Hello debuging!!!!');

  //chrome.app.window.current().fullscreen();
  

  var ssdp = require('./ssdp/chrome.js');
  console.log('ssdp = ', ssdp);
  
  var deviceIpAddress = "0.0.0.0";

  // get device IP address before start any service
  chrome.system.network.getNetworkInterfaces(function(interfaces){

        for (var i = 0; i < interfaces.length; i++) {
          var interfaceObj = interfaces[i]
          if( interfaceObj.address && _validateIPaddress(interfaceObj.address )){
            deviceIpAddress = interfaceObj.address
            console.log('found IP-ADDRESS = ', interfaceObj.address);
            break;
          }
        };


        // start ssdp broadcaster
        ssdp.createDevice({
            uuid: '2fac1234-31f8-1111-2222-08002b34c003',
            serviceList: ['upnp:rootdevice', 'urn:dial-multiscreen-org:device:dial:1', 'urn:dial-multiscreen-org:service:dial:1'],
            location: 'http://'+deviceIpAddress+':1999/device.description.xml'
        }, function(err, device) {

            if (err) {
                return console.log(err);
            }
            device.start();
            console.log('device = ', device );
            startWebServer();
        });

  });

  


  

////////////////////////////////////////////////
// WEB SERVER
////////////////////////////////////////////////

  var hosts = "0.0.0.0";
  var port = 1999;
  var directory = "";

  var tcpServer = chrome.sockets.tcpServer;
  var tcpSocket = chrome.sockets.tcp;

  var serverSocketId = null;
  var filesMap = {};

  var stringToUint8Array = function(string) {
    var buffer = new ArrayBuffer(string.length);
    var view = new Uint8Array(buffer);
    for (var i = 0; i < string.length; i++) {
      view[i] = string.charCodeAt(i);
    }
    return view;
  };

  var arrayBufferToString = function(buffer) {
    var str = '';
    var uArrayVal = new Uint8Array(buffer);
    for (var s = 0; s < uArrayVal.length; s++) {
      str += String.fromCharCode(uArrayVal[s]);
    }
    return str;
  };

  var logToScreen = function(log) {
    // logger.textContent += log + "\n";
    // logger.scrollTop = logger.scrollHeight;
  };

  var destroySocketById = function(socketId) {
    tcpSocket.disconnect(socketId, function() {
      tcpSocket.close(socketId);
    });
  };

  var closeServerSocket = function() {
    if (serverSocketId) {
      tcpServer.close(serverSocketId, function() {
        if (chrome.runtime.lastError) {
          console.warn("chrome.sockets.tcpServer.close:", chrome.runtime.lastError);
        }
      });
    }

    tcpServer.onAccept.removeListener(onAccept);
    tcpSocket.onReceive.removeListener(onReceive);
  };

  var sendReplyToSocket = function(socketId, buffer, keepAlive) {
    // verify that socket is still connected before trying to send data
    tcpSocket.getInfo(socketId, function(socketInfo) {
      if (!socketInfo.connected) {
        destroySocketById(socketId);
        return;
      }

      tcpSocket.setKeepAlive(socketId, keepAlive, 1, function() {
        if (!chrome.runtime.lastError) {
          tcpSocket.send(socketId, buffer, function(writeInfo) {
            // console.log("WRITE", writeInfo);

            if (!keepAlive || chrome.runtime.lastError) {
              destroySocketById(socketId);
            }
          });
        }
        else {
          console.warn("chrome.sockets.tcp.setKeepAlive:", chrome.runtime.lastError);
          destroySocketById(socketId);
        }
      });
    });
  };

  var getResponseHeader = function(file, errorCode, keepAlive) {
    var httpStatus = "HTTP/1.0 200 OK";
    var contentType = "text/plain";
    var contentLength = 0;

    if (!file || errorCode) {
      httpStatus = "HTTP/1.0 " + (errorCode || 404) + " Not Found";
    }
    else {
      contentType = file.type || contentType;
      contentLength = file.size;
    }

    var lines = [
      httpStatus,
      "Content-length: " + contentLength,
      "Content-type:" + contentType
    ];

    if (keepAlive) {
      lines.push("Connection: keep-alive");
    }

    return stringToUint8Array(lines.join("\n") + "\n\n");
  };

  var getXMLSuccessHeader = function( xmlData, keepAlive) {
    var httpStatus = "HTTP/1.0 200 OK";
    var contentType = "text/plain";
    var contentLength = 0;

    if (!xmlData) {
      httpStatus = "HTTP/1.0 " + (404) + " Not Found";
      // contentLength = stringToUint8Array(xmlData + "\n\n").byteLength;
    }
    else {
      contentType = "application/xml;charset=utf-8";
      contentLength = stringToUint8Array(xmlData).byteLength;
    }

    var lines = [
      httpStatus,
      "Content-length: " + contentLength,
      "Content-type:" + contentType

    ];

    if (keepAlive) {
      lines.push("Connection: keep-alive");
    }

    return stringToUint8Array(lines.join("\n") + "\n\n");
  }

  var getErrorHeader = function(errorCode, keepAlive) {
    return getResponseHeader(null, errorCode, keepAlive);
  };

  var getSuccessHeader = function(file, keepAlive) {
    return getResponseHeader(file, null, keepAlive);
  };

  var writeErrorResponse = function(socketId, errorCode, keepAlive) {
    console.info("writeErrorResponse:: begin... ");

    var header = getErrorHeader(errorCode, keepAlive);
    console.info("writeErrorResponse:: Done setting header...");
    var outputBuffer = new ArrayBuffer(header.byteLength);
    var view = new Uint8Array(outputBuffer);
    view.set(header, 0);
    console.info("writeErrorResponse:: Done setting view...");

    sendReplyToSocket(socketId, outputBuffer, keepAlive);

    console.info("writeErrorResponse::filereader:: end onload...");
    console.info("writeErrorResponse:: end...");
  };

  var writeXML200Response = function(socketId, xmlData, keepAlive) {
    var msgBuffer = stringToUint8Array(xmlData)

    var header = getXMLSuccessHeader(xmlData, keepAlive);
    var outputBuffer = new ArrayBuffer(header.byteLength + msgBuffer.byteLength);

    var view = new Uint8Array(outputBuffer);
    view.set(header, 0);

    setTimeout(function() {
      console.log('return xml');
      view.set( new Uint8Array(msgBuffer), header.byteLength);
      sendReplyToSocket(socketId, outputBuffer, keepAlive);
    }, 500);
  };

  var write200Response = function(socketId, file, keepAlive) {
    var header = getSuccessHeader(file, keepAlive);
    var outputBuffer = new ArrayBuffer(header.byteLength + file.size);
    var view = new Uint8Array(outputBuffer);
    view.set(header, 0);

    var fileReader = new FileReader();
    fileReader.onload = function(e) {
      view.set(new Uint8Array(e.target.result), header.byteLength);
      sendReplyToSocket(socketId, outputBuffer, keepAlive);
    };

    fileReader.readAsArrayBuffer(file);
  };

  var onAccept = function(acceptInfo) {
    tcpSocket.setPaused(acceptInfo.clientSocketId, false);
    
    if (acceptInfo.socketId != serverSocketId)
      return;

    console.log("ACCEPT", acceptInfo);
  };

  var onReceive = function(receiveInfo) {
    console.log("READ", receiveInfo);
    var socketId = receiveInfo.socketId;

    // Parse the request.
    var data = arrayBufferToString(receiveInfo.data);
    // we can only deal with GET requests
    if (data.indexOf("GET ") !== 0) {
      console.log('POST data',data);
      // close socket and exit handler
      destroySocketById(socketId);
      return;
    }
    
    var keepAlive = false;
    if (data.indexOf("Connection: keep-alive") != -1) {
      keepAlive = true;
    }

    var uriEnd = data.indexOf(" ", 4);
    if (uriEnd < 0) { /* throw a wobbler */ return; }
    var uri = data.substring(4, uriEnd);
    // strip query string
    var q = uri.indexOf("?");
    if (q != -1) {
      uri = uri.substring(0, q);
    }

    console.log('uri = ' + uri);

    if( uri == "/device.description.xml"){
      console.log("GET 200 " + uri);

      var responseMsg = '<?xml version="1.0" encoding="utf-8"?> \
          <root xmlns="urn:schemas-upnp-org:device-1-0"> \
              <specVersion> \
              <major>1</major> \
              <minor>0</minor> \
              </specVersion> \
              <URLBase>http://'+deviceIpAddress+':1999/apps/</URLBase> \
              <device> \
                  <deviceType>urn:dial-multiscreen-org:device:dial:1</deviceType> \
                  <friendlyName>Chrome App xxxxxxxxxxxxx</friendlyName> \
                  <manufacturer>ScreenCloud, Chrome App</manufacturer> \
                  <modelName>Retina</modelName> \
                  <UDN>uuid:2fac1234-31f8-1111-2222-08002b34c003</UDN> \
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

      writeXML200Response(socketId, responseMsg, keepAlive);

    }else{
      console.log("\n\n\n\nGET 200 ==========> " + uri);
      writeXML200Response(socketId, "", keepAlive);
    }


  };

  function onChangeDirectory(e) {
    closeServerSocket();

    var files = e.target.files;

    for (var i = 0; i < files.length; i++) {
      //remove the first first directory
      var path = files[i].webkitRelativePath;
      if (path && path.indexOf("/") >= 0) {
        filesMap[path.substr(path.indexOf("/"))] = files[i];
      } else {
        filesMap["/" + files[i].fileName] = files[i];
      }
    }
  };

  function startWebServer() {
    console.log('------- startWebServer --------');
    tcpServer.create({}, function(socketInfo) {
      serverSocketId = socketInfo.socketId;

      tcpServer.listen(serverSocketId, hosts, parseInt(port, 10), 50, function(result) {
        console.log("LISTENING:", result);

        tcpServer.onAccept.addListener(onAccept);
        tcpSocket.onReceive.addListener(onReceive);
      });
    });
  };

  function stopWebServer() {
    closeServerSocket();
  };

  chrome.system.network.getNetworkInterfaces(function(interfaces) {
    for (var i in interfaces) {
      var interface = interfaces[i];
      var opt = document.createElement("option");
      console.log('available interfaces['+i+'] = ' + interface.name + " - " + interface.address);
    }
  });


/**
   * Converts a string to an array buffer
   *
   * @private
   * @param {String} str The string to convert
   * @param {Function} callback The function to call when conversion is complete
   */
  function _stringToArrayBuffer(str, callback) {
    var bb = new Blob([str]);
    var f = new FileReader();
    f.onload = function(e) {
        callback(e.target.result);
    };
    f.readAsArrayBuffer(bb);
  }

  function _validateIPaddress(ipaddress)   
  {  
   if (/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ipaddress))  
    {  
      return (true)  
    }  
  console.log("invalid IP address! ", ipaddress)  
  return (false)  
  }  


}