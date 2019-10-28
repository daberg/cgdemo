var demo = demo || {};
    
demo.graphics = (function() {
    var gl = null;

    var pub = {};

    pub.init = function(canvas) {
        if (gl)
            return;

        gl = canvas.getContext('webgl2');
        if (!gl) {
            alert('Your browser does not support WebGL2 :(');
            throw new Error('WebGL2 not supported');
        }

        gl.enable(gl.CULL_FACE);
        gl.enable(gl.DEPTH_TEST);
    },

    pub.getOpenGL = function() {
        return gl;
    }

    return pub;
})();
