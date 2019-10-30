var demo = demo || {};

demo.input = (function () {
    var pub = {};

    pub.fwd = false;
    pub.bwd = false;
    pub.uwd = false;
    pub.dwd = false;
    pub.lwd = false;
    pub.rwd = false;

    var handlers = {
        // A key
        65: function(state) {
            pub.lwd = state;
        },
        // D key
        68: function(state) {
            pub.rwd = state;
        },
        // S key
        83: function(state) {
            pub.bwd = state;
        },
        // W key
        87: function(state) {
            pub.fwd = state;
        },
        // Q key
        81: function(state) {
            pub.dwd = state;
        },
        // E key
        69: function(state) {
            pub.uwd = state;
        }
    };

    window.addEventListener(
        "keydown",
        function(e) {
            if (e.keyCode in handlers) {
                handlers[e.keyCode](true);
            }
        },
        false
    );

    window.addEventListener(
        "keyup",
        function(e) {
            if (e.keyCode in handlers) {
                handlers[e.keyCode](false);
            }
        },
        false
    );

    return pub;
})();
