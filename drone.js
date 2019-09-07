var drone = (function() {
    /*** Private variables that public methods are closing over ***/

    var shaderPaths = [
        "drone-vs.glsl",
        "drone-fs.glsl"
    ].map(name => config.shaderDirPath + name);

    var program = null;

    /*** Collection of public methods ***/

    var pub = {};

    pub.Drone = function() {
        var vertices;
        var colors;
        var indices;

        var worldMatrix;

        var vao;
        var matrixLocation;

        this.loadModel = function() {
            vertices = [
                 0.0,  20.0,  0.0,
                -2.0,  0.0,   2.0,
                 2.0,  0.0,   2.0,
                 2.0,  0.0,  -2.0,
                -2.0,  0.0,  -2.0
            ];

            colors = [
                1.0, 1.0, 0.0,
                1.0, 0.0, 0.0,
                0.0, 1.0, 0.0,
                0.0, 0.0, 1.0,
                0.0, 1.0, 1.0
            ];

            indices = [
                0, 1, 2,
                0, 2, 3,
                0, 3, 4,
                0, 4, 1,
                4, 3, 1,
                3, 2, 1
            ];
        }

        this.initBuffers = function() {
            var gl = graphics.getContext();

            vao = gl.createVertexArray();
            gl.bindVertexArray(vao);

            var positionAttributeLocation = gl.getAttribLocation(program, "v_position");
            var positionBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
            gl.enableVertexAttribArray(positionAttributeLocation);
            gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);

            var colorAttributeLocation = gl.getAttribLocation(program, "v_color");
            var colorBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
            gl.enableVertexAttribArray(colorAttributeLocation);
            gl.vertexAttribPointer(colorAttributeLocation, 3, gl.FLOAT, false, 0, 0);

            var indexBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
            matrixLocation = gl.getUniformLocation(program, "matrix");
        }

        this.loadShaders = function() {
            if (program)
                return;

            var gl = graphics.getContext();
            var vShaderCode, fShaderCode;
            var success;

            utils.loadFiles(
                shaderPaths,
                function(shaderCodeList) {
                    success = true;
                    vShaderCode = shaderCodeList[0];
                    fShaderCode = shaderCodeList[1];
                },
                function(urls) {
                    success = false;
                    urls.forEach(function(url) {
                        log.logError("Could not fetch shader at: " + url);
                    });
                });

            if (!success) {
                throw new Error("Could not load drone shaders");
            }

            var vertexShader = utils.createShader(gl, gl.VERTEX_SHADER, vShaderCode);
            var fragmentShader = utils.createShader(gl, gl.FRAGMENT_SHADER, fShaderCode);

            program = utils.createProgram(gl, vertexShader, fragmentShader);
        }

        this.init = function() {
            this.loadModel();
            this.loadShaders();
            this.initBuffers();
        }

        this.draw = function(viewMatrix, perspectiveMatrix) {
            var gl = graphics.getContext();

            var wvMatrix = utils.multiplyMatrices(viewMatrix, worldMatrix);
            var wvpMatrix = utils.multiplyMatrices(perspectiveMatrix, wvMatrix);
    
            gl.useProgram(program);
    
            gl.uniformMatrix4fv(matrixLocation, gl.FALSE, utils.transposeMatrix(wvpMatrix));
    
            gl.bindVertexArray(vao);
            gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
        }

        this.getWorldMatrix = function() {
            return worldMatrix;
        }

        this.setWorldMatrix = function(newWorldMatrix) {
            worldMatrix = newWorldMatrix;
        }
    };

    return pub;
})();
