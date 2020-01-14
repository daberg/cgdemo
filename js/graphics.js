var demo = demo || {};
    
demo.graphics = (function() {
    var gl = null;

    var pub = {};

    pub.init = function(canvas) {
        if (gl)
            return;

        gl = canvas.getContext(
            'webgl2',
            {alpha: false}
        );
        if (!gl) {
            alert('Your browser does not support WebGL2 :(');
            throw new Error('WebGL2 not supported');
        }

        gl.enable(gl.CULL_FACE);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    },

    pub.getOpenGL = function() {
        return gl;
    }

    return pub;
})();
