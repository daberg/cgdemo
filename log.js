var log = (function() {
    var pub = {};

    if (config.debugging) {
        pub.logMessage = function(msg) {
            console.log("[DEMO]" + msg);
        }
    }
    else {
        pub.logMessage = function(msg) {
            return;
        }
    }

    pub.logError = function(msg) {
        pub.logMessage("[ERROR]" + msg);
    },
    
    pub.logException = function(err) {
        pub.logMessage(
            "[EXCEPTION]\n"
            + err.name + ": "
            + err.message + "\n"
            + err.stack
        );
    }

    return pub;
})();
