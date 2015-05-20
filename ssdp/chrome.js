// module interface for chrome os

var udp = require('./lib/udp/udp-chrome.js');

module.exports = {
    createDevice: require('./lib/device.js')(udp)
};

// createClient: require('./lib/client.js')(udp),