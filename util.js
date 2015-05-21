module.exports = (function(){

	function Util(){

	}

	Util.prototype = {
		isFunction: function(object){
			return object && getClass.call(object) == '[object Function]';
		},

		validateIPaddress: function(ipaddress){
	        if (/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ipaddress))
	        {
	            return (true)
	        }
	        return (false)
	    },

	    stringToArrayBuffer: function(str, callback) {
	        var bb = new Blob([str]);
	        var f = new FileReader();
	        f.onload = function(e) {
	            callback(e.target.result);
	        };
	        f.readAsArrayBuffer(bb);
	    }
	}
	
	return Util;
})();
