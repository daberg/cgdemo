var log = {
    logMessage: function(msg) {
        console.log("[DEMO]" + msg);
    },
    
    logError: function(msg) {
        log.logMessage("[ERROR]" + msg);
    },
    
    logException: function(err) {
        log.logMessage("[EXCEPTION]\n" + err.name + ": " + err.message + "\n" + err.stack);
    }
};
