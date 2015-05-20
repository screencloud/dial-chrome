/**
 * Listens for the app launching then creates the window
 *
 * @see http://developer.chrome.com/apps/app.runtime.html
 * @see http://developer.chrome.com/apps/app.window.html
 */

var DialService = require('./dialService.js');
var dialService = new DialService();


function reload() { chrome.runtime.reload() }

chrome.app.runtime.onLaunched.addListener(function(o) {

//   // Center window on screen.
//   var screenWidth = screen.availWidth;
//   var screenHeight = screen.availHeight;
//   var width = 500;
//   var height = 500;

//   chrome.app.window.create('window.html', {
//     id: "screencloudPlayer",
//     outerBounds: {
//       width: width,
//       height: height,
//       left: Math.round((screenWidth-width)/2),
//       top: Math.round((screenHeight-height)/2)
//     }
//   });

  dialService.start();
  console.log('dialService', dialService);

});

