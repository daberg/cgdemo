var demo = demo || {};

demo.terrain = (function (){
    var shaderPaths = [
        "terrain-vs.glsl",
        "terrain-fs.glsl"
    ].map(name => demo.config.shaderDirPath + name);

    var texturePath = demo.config.textureDirPath + "/mountain.png";

    var program;
    var texture;

    var pub = {};

    pub.Tile = function (vertices, indices, size, seed) {
        var size = new Float32Array(size);
        var seed = new Float32Array(seed);

        var cx = 0;
        var cy = 0;
        var cz = 0;

        var vertices = vertices;
        var indices = indices;

        var wMatrix;
        var nwMatrix;

        var vao;

        var sizeLocation;
        var seedLocation;

        var wMatrixLocation;
        var wvpMatrixLocation;
        var nwMatrixLocation;

        var lightDirLocation;
        var lightColorLocation;

        var obsPosLocation;

        this.loadModel = function() {
            var gl = demo.graphics.getOpenGL();

            texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, texture);

            // Load temporary texture while waiting
            gl.texImage2D(
                gl.TEXTURE_2D,
                0,
                gl.RGBA,
                1,
                1,
                0,
                gl.RGBA,
                gl.UNSIGNED_BYTE,
                new Uint8Array([0, 0, 255, 255])
            );

            // Apply actual texture when it is ready
            var image = new Image();
            image.src = texturePath;
            if ((new URL(texturePath)).origin !== window.location.origin) {
                image.crossOrigin = "";
            }
            image.onload = function() {
                gl.bindTexture(gl.TEXTURE_2D, texture);
                gl.texImage2D(
                    gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image
                );
                gl.texParameteri(
                    gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR
                );
                gl.texParameteri(
                    gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR
                );
                gl.generateMipmap(gl.TEXTURE_2D);
            };
        };

        this.loadShaders = function() {
            program = program || utils.loadShaders(
                demo.graphics.getOpenGL(),
                shaderPaths
            );
        };

        this.initBuffers = function () {
            var gl = demo.graphics.getOpenGL();

            // Use new VAO
            vao = gl.createVertexArray();
            gl.bindVertexArray(vao);

            // Initialize position buffer
            var positionBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
            gl.bufferData(
                gl.ARRAY_BUFFER,
                new Float32Array(vertices),
                gl.STATIC_DRAW
            );
            // Initialize position attribute
            var posAttribLocation = gl.getAttribLocation(
                program, "v_model_pos"
            );
            gl.enableVertexAttribArray(posAttribLocation);
            gl.vertexAttribPointer(
                posAttribLocation, 3, gl.FLOAT, false, 0, 0
            );

            // Initialize index buffer
            var indexBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
            gl.bufferData(
                gl.ELEMENT_ARRAY_BUFFER,
                new Uint32Array(indices),
                gl.STATIC_DRAW
            );

            sizeLocation = gl.getUniformLocation(program, "tile_size");
            seedLocation = gl.getUniformLocation(program, "tile_seed");

            wMatrixLocation = gl.getUniformLocation(program, "v_w_matrix");
            wvpMatrixLocation = gl.getUniformLocation(program, "v_wvp_matrix");
            nwMatrixLocation = gl.getUniformLocation(program, "n_w_matrix");

            lightDirLocation = gl.getUniformLocation(program, 'light_dir');
            lightColorLocation = gl.getUniformLocation(program, 'light_color');

            obsPosLocation = gl.getUniformLocation(program, 'obs_w_pos');
        };

        this.init = function() {
            this.loadModel();
            this.loadShaders();
            this.initBuffers();
            this.moveTo(0, 0);
        };

        this.draw = function(context) {
            var gl = demo.graphics.getOpenGL();

            var wvpMatrix = utils.multiplyMatrices(
                context.pMatrix,
                utils.multiplyMatrices(
                    context.vMatrix,
                    wMatrix
                )
            );
            var nwMatrix = utils.makeNormalWorld(wMatrix);

            gl.useProgram(program);

            gl.uniformMatrix4fv(
                wMatrixLocation,
                gl.FALSE,
                utils.transposeMatrix(wMatrix)
            );

            gl.uniformMatrix4fv(
                wvpMatrixLocation,
                gl.FALSE,
                utils.transposeMatrix(wvpMatrix)
            );

            gl.uniformMatrix4fv(
                nwMatrixLocation,
                gl.FALSE,
                utils.transposeMatrix(nwMatrix)
            );

            gl.uniform2fv(sizeLocation, size);
            gl.uniform2fv(seedLocation, seed);

            gl.uniform3fv(lightDirLocation, context.lightDir);
            gl.uniform3fv(lightColorLocation, context.lightColor);

            gl.uniform3fv(obsPosLocation, context.cameraPos);

            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.bindVertexArray(vao);
            gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_INT, 0);
        };

        this.moveTo = function(newX, newZ) {
            cx = newX;
            cz = newZ;
            wMatrix = utils.makeWorld(cx, 0, cz, 0, 0, 0, 1);
        };
    }

    /**
     * Generate a terrain tile on the XZ plane, centered in the origin.
     * @param {number[]} size - Size of the tile on the XZ plane, must be
     *                          divisible by step
     * @param {number}   step - Distance between two adjacent vertices
     * @param {number[]} seed - Tile seed (corresponds to x and z coordinates
     *                          in the universe of tiles of the specified size)
     */
    pub.generateTile = function(size, step, seed) {
        // The adopted convention is that the Z axis points North and the X
        // axis points West.
        // Rows are made of vertices with the same z coordinate, and columns
        // are made of vertices with the same x coordinate.

        var step = step || 2.0;

        var xLen = size[0];
        var zLen = size[1];

        // Number of vertices per row and column respectively
        // Steps are the intervals between vertices, so we add one
        var rowLen = size[0] / step + 1;
        var colLen = size[1] / step + 1;

        if (!utils.isInteger(rowLen) || !utils.isInteger(colLen)
            || rowLen < 2 || colLen < 2 || step < 1) {
            throw new Error("Incorrect parameters for generateTerrain");
        }

        // Start so that the terrain is centered in the origin
        var zStart =   (xLen / 2);
        var xStart = - (zLen / 2);

        var height = 0.0;

        var numVertices = rowLen * colLen;
        var vertices = [numVertices * 3];

        var offset = 0;
        for (var i = 0; i < rowLen; i++) {
            var z = zStart - step * i;

            for (var j = 0; j < colLen; j++) {
                var x = xStart + step * j;

                vertices[offset] = x;
                offset++;

                vertices[offset] = height;
                offset++;

                vertices[offset] = z;
                offset++;
            }
        }

        var numRowTriangles = 2 * (rowLen - 1);
        var numIndices = numRowTriangles * (colLen - 1) * 3;

        var indices = [numIndices];
        var offset = 0;

        for (var i = 0; i < rowLen - 1; i++) {
            for (var j = 0; j < colLen - 1; j++) {
                // Rightmost triangle
                indices[offset] = i * colLen + j;
                offset++;
                indices[offset] = i * colLen + (j + 1);
                offset++;
                indices[offset] = (i + 1) * colLen + j;
                offset++;

                // Leftmost triangle
                indices[offset] = i * colLen + (j + 1);
                offset++;
                indices[offset] = (i + 1) * colLen + (j + 1);
                offset++;
                indices[offset] = (i + 1) * colLen + j;
                offset++;
            }
        }

        return new pub.Tile(vertices, indices, size, seed);
    }

    return pub;
})();
