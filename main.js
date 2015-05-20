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
  console.log('onLaunched');

  dialService.start();
  console.log('dialService', dialService);

});

