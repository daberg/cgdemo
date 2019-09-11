var drone = (function() {
    var shaderPaths = [
        "drone-vs.glsl",
        "drone-fs.glsl"
    ].map(name => config.shaderDirPath + name);

    var program = null;

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

            // Use new VAO
            vao = gl.createVertexArray();
            gl.bindVertexArray(vao);

            // Initialize position buffer
            var positionBuffer = gl.createBuffer();
            gl.bindBuffer(
                gl.ARRAY_BUFFER, positionBuffer
            );
            gl.bufferData(
                gl.ARRAY_BUFFER,
                new Float32Array(vertices),
                gl.STATIC_DRAW
            );
            // Initialize position attribute
            var positionAttributeLocation = gl.getAttribLocation(
                program, "v_position"
            );
            gl.enableVertexAttribArray(positionAttributeLocation);
            gl.vertexAttribPointer(
                positionAttributeLocation, 3, gl.FLOAT, false, 0, 0
            );

            // Initialize color buffer
            var colorBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
            gl.bufferData(
                gl.ARRAY_BUFFER,
                new Float32Array(colors),
                gl.STATIC_DRAW
            );
            // Initialize color attribute
            var colorAttributeLocation = gl.getAttribLocation(
                program, "v_color"
            );
            gl.enableVertexAttribArray(colorAttributeLocation);
            gl.vertexAttribPointer(
                colorAttributeLocation, 3, gl.FLOAT, false, 0, 0
            );

            // Initialize index buffer
            var indexBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
            gl.bufferData(
                gl.ELEMENT_ARRAY_BUFFER,
                new Uint16Array(indices),
                gl.STATIC_DRAW
            );

            matrixLocation = gl.getUniformLocation(program, "wvp_matrix");
        }

        this.loadShaders = function() {
            program = program || utils.loadShaders(
                graphics.getContext(),
                shaderPaths
            );
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
