var terrain = (function (){
    var shaderPaths = [
        "terrain-vs.glsl",
        "terrain-fs.glsl"
    ].map(name => config.shaderDirPath + name);

    var program;

    var pub = {};

    pub.Tile = function (vertices, indices, size, seed) {
        var vertices = vertices;
        var indices = indices;
        var size = new Float32Array(size);
        var seed = new Float32Array(seed);

        var worldMatrix;
        var nWorldMatrix;

        var vao;
        var sizeLocation;
        var seedLocation;
        var wvpMatrixLocation;
        var nwMatrixLocation;
        var lightDirLocation;
        var lightColorLocation;

        this.setIndices = function(newIndices) {
            indices = newIndices;
        }

        this.setVertices = function(newVertices) {
            vertices = newVertices;
        }

        this.getWorldMatrix = function() {
            return worldMatrix;
        }

        this.setWorldMatrix = function(newWorldMatrix) {
            worldMatrix = newWorldMatrix;
            nWorldMatrix = utils.invertMatrix(utils.transposeMatrix(
                worldMatrix
            ));
        }

        this.loadShaders = function() {
            program = program || utils.loadShaders(
                graphics.getContext(),
                shaderPaths
            );
        }

        this.initBuffers = function () {
            var gl = graphics.getContext();

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
                program, "v_position"
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
            wvpMatrixLocation = gl.getUniformLocation(program, "wvp_matrix");
            nwMatrixLocation = gl.getUniformLocation(program, "nw_matrix");
            lightDirLocation = gl.getUniformLocation(program, 'light_dir');
            lightColorLocation = gl.getUniformLocation(program, 'light_color');
        }

        this.init = function() {
            this.loadShaders();
            this.initBuffers();
        }

        this.draw = function(vMatrix, pMatrix, lightDir, lightColor) {
            var gl = graphics.getContext();

            var wvMatrix = utils.multiplyMatrices(vMatrix, worldMatrix);
            var wvpMatrix = utils.multiplyMatrices(pMatrix, wvMatrix);

            gl.useProgram(program);

            gl.uniformMatrix4fv(
                wvpMatrixLocation,
                gl.FALSE,
                utils.transposeMatrix(wvpMatrix)
            );

            gl.uniformMatrix4fv(
                nwMatrixLocation,
                gl.FALSE,
                utils.transposeMatrix(nWorldMatrix)
            );

            gl.uniform2fv(sizeLocation, size);
            gl.uniform2fv(seedLocation, seed);

            gl.uniform3fv(lightDirLocation, new Float32Array(lightDir));
            gl.uniform3fv(lightColorLocation, new Float32Array(lightColor));

            gl.bindVertexArray(vao);
            gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_INT, 0);
        }
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
        // Steps are the intervals between vertices, so we subtract one
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
