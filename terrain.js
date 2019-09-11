var terrain = (function (){
    var shaderPaths = [
        "terrain-vs.glsl",
        "terrain-fs.glsl"
    ].map(name => config.shaderDirPath + name);

    var program;

    var pub = {};

    pub.Terrain = function (vertices, indices) {
        var vertices = vertices;
        var indices = indices;

        var worldMatrix;

        var vao;
        var matrixLocation;

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
                new Uint16Array(indices),
                gl.STATIC_DRAW
            );

            matrixLocation = gl.getUniformLocation(program, "wvp_matrix");
        }

        this.init = function() {
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
    }

    /**
     * Generate a terrain mesh on the XZ plane.
     * @param {integer} rowLen - Number of vertices per row.
     * @param {integer} colLen - Number of vertices per column.
     * @param {float}   step   - Distance between two adjacent vertices.
     */
    pub.generateTerrain = function(rowLen, colLen, step) {
        // The adopted convention is that the Z axis points North and the X
        // axis points West.
        // Rows are made of vertices with the same z coordinate, and columns
        // are made of vertices with the same x coordinate.
        rowLen = rowLen || -1;
        colLen = colLen || -1;

        if (rowLen < 2 || colLen < 2) {
            throw new Error("Incorrect parameters for generateTerrain");
        }

        var step = step || 2.0;

        // Actual terrain dimensions
        // Steps are the intervals between vertices, so we subtract one
        var zLen = (colLen - 1) * step;
        var xLen = (rowLen - 1) * step;

        // Start so that the terrain is centered in the origin
        var zStart =   (xLen / 2);
        var xStart = - (zLen / 2);

        var height = 0.0;

        var numVertices = rowLen * colLen;
        var vertices = [numVertices * 3];

        if (vertices.length > 65536) {
            throw new Error("The specified size is too large");
        }

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

        return new pub.Terrain(vertices, indices);
    }

    return pub;
})();
