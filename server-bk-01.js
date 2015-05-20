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
  // ssdp.createClient(1901, function(err, client) {

  //     if (err) {
  //         return console.log(err);
  //     }

  //     client.on('response', function(headers) {

  //         console.log(headers);
  //         console.log('\n');

  //     });

  //     client.search('urn:dial-multiscreen-org:service:dial:1');

  // });
  
  var deviceIpAddress = "0.0.0.0";

    chrome.system.network.getNetworkInterfaces(function(interfaces){
        // console.log('interfaces = ', interfaces);
        for (var i = 0; i < interfaces.length; i++) {
          var interfaceObj = interfaces[i]
          // console.log('interfaceObj = ', interfaceObj);
          console.log('interfaceObj.address = ', interfaceObj.address);
          if( interfaceObj.address && _validateIPaddress(interfaceObj.address )){
            deviceIpAddress = interfaceObj.address
            console.log('found IP-ADDRESS = ', interfaceObj.address);
            break;
          }
        };



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

        });

  });

  


  // var start = document.getElementById("start");
  // var stop = document.getElementById("stop");
  // var hosts = document.getElementById("hosts");
  // var port = document.getElementById("port");
  var hosts = '192.168.10.36'; // '0.0.0.0';
  var port = 1999;
  // var directory = document.getElementById("directory");

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

    console.log(log);
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
            console.log("WRITE", writeInfo);

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

  var makeResponseHeader = function(content) {
    var httpStatus = "HTTP/1.0 200 OK";
    var contentType = "text/plain";
    var contentLength = 0;

    if (!content || errorCode) {
      httpStatus = "HTTP/1.0 " + (errorCode || 404) + " Not Found";
    }
    else {
      contentType = "application/xml;charset=utf-8"; //content.type || contentType;
      contentLength = content.length();
    }

    var lines = [
      httpStatus,
      "Content-length: " + contentLength
    ];

    // ,
    //   "Content-type:" + contentType

    lines.push("Connection: keep-alive");

    return stringToUint8Array(lines.join("\n") + "\n\n");
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

  // function getParameterByName(uri, name) {

  //   //location.search

  //   name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
  //   var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
  //       results = regex.exec(uri);
  //   return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
  // }

  var onReceive = function(receiveInfo) {
    console.log("READ", receiveInfo);
    var socketId = receiveInfo.socketId;

    // Parse the request.
    var data = arrayBufferToString(receiveInfo.data);

    // we can only deal with GET requests
    if (data.indexOf("GET ") !== 0) {
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

    var queryString = {};
    uri.replace(
        new RegExp("([^?=&]+)(=([^&]*))?", "g"),
        function($0, $1, $2, $3) { queryString[$1] = $3; }
    );


    var url = uri.substr(uri.indexOf('url=') + 4, uri.legth);

    console.log('uri: ' + uri);
    // console.log('url: ' + url);

    if(uri == "/device.description.xml"){
      // write200Response(socketId, file, keepAlive);
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

        console.log('send to socketId : ', socketId);

        _stringToArrayBuffer(responseMsg, function(arrayBuffer) {

          // sendReplyToSocket(socketId, arrayBuffer, keepAlive);

          tcpSocket.send(socketId, arrayBuffer,
            function() {
              // chrome.sockets.tcp.close(socketId);
          });

        });

        // tcpSocket.send(socketId, arrayBuffer,
        //   function() {
        //     // chrome.sockets.tcp.close(socketId);
        //   });
        // });

    }else{
      // console.log('getParameterByName("url"):' + getParameterByName(uri, 'url'));
      // console.log('command: ' + queryString['command']);
      console.log('else url: ' + queryString['url']);
      console.log('else uri: ' + uri);

      chrome.sockets.tcp.close(socketId);
      webView.src = url;

    }

    


    // strip query string
    // var q = uri.indexOf("?");
    // if (q != -1) {
    //   uri = uri.substring(0, q);
    // }

    // console.log('q:' + q);
    // console.log('uri:' + uri);

    // var file = filesMap[uri];
    // var file = '/Users/nut/Developer/labs/html/solid/theme/hello.html';
    // if (!!file == false) {
      // console.warn("File does not exist..." + uri);
      // writeErrorResponse(socketId, 404, keepAlive);
      // return;
    // }
    // logToScreen("GET 200 " + uri);
    //write200Response(socketId, file, keepAlive);

  };

  // directory.onchange = function(e) {
  //   closeServerSocket();

  //   var files = e.target.files;

  //   for (var i = 0; i < files.length; i++) {
  //     //remove the first first directory
  //     var path = files[i].webkitRelativePath;
  //     if (path && path.indexOf("/") >= 0) {
  //       filesMap[path.substr(path.indexOf("/"))] = files[i];
  //     } else {
  //       filesMap["/" + files[i].fileName] = files[i];
  //     }
  //   }

  //   start.disabled = false;
  //   stop.disabled = true;
  //   directory.disabled = true;
  // };

  // start.onclick = function() {

    tcpServer.create({}, function(socketInfo) {
      serverSocketId = socketInfo.socketId;

      tcpServer.listen(serverSocketId, hosts, parseInt(port, 10), 50, function(result) {
        console.log("LISTENING:", result);

        tcpServer.onAccept.addListener(onAccept);
        tcpSocket.onReceive.addListener(onReceive);
      });
    });

    // directory.disabled = true;
    // stop.disabled = false;
    // start.disabled = true;
  // };

  // stop.onclick = function() {
  //   directory.disabled = false;
  //   stop.disabled = true;
  //   start.disabled = false;
  //   closeServerSocket();
  // };


  // chrome.system.network.getNetworkInterfaces(function(interfaces) {
  //   for (var i in interfaces) {
  //     var interface = interfaces[i];
  //     var opt = document.createElement("option");
  //     opt.value = interface.address;
  //     opt.innerText = interface.name + " - " + interface.address;
  //     console.log('opt = ', opt);
  //     // hosts.appendChild(opt);
  //   }
  // });




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