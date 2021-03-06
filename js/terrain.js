var demo = demo || {};

demo.terrain = (function (){
    var noiseShaderPaths = [
        "terrain-nvs.glsl",
        "terrain-nfs.glsl"
    ].map(name => demo.config.shaderDirPath + name);

    var drawShaderPaths = [
        "terrain-vs.glsl",
        "terrain-fs.glsl"
    ].map(name => demo.config.shaderDirPath + name);

    var texturePaths = [
        "terrain-color.png",
        "terrain-normal.png"
    ].map(name => demo.config.textureDirPath + name);

    var textures;

    var noiseProgram;
    var drawProgram;

    var pub = {};

    pub.Tile = function (vertices, indices, size, seed) {
        var size = new Float32Array(size);
        var seed = new Float32Array(seed);

        var cx = 0;
        var cy = 0;
        var cz = 0;

        var vertices = vertices;
        var indices = indices;
        var numIndices = indices.length;

        var positionBuffer;
        var normalBuffer;
        var tangentBuffer;
        var binormalBuffer;
        var indexBuffer;

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

        var ambientLowerColorLocation;
        var ambientUpperColorLocation;

        var skyColorLocation;

        var obsPosLocation;

        var samplerLocations;

        this.loadModel = function() {
            // If an instance has already loaded our textures, we are done
            if (textures)
                return;

            var gl = demo.graphics.getOpenGL();
            
            textures = new Array();
            var numTextures = texturePaths.length;

            for (var texNum = 0; texNum < numTextures; texNum++) {
                texture = gl.createTexture();

                textures.push(texture);
                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, texture);
                gl.texImage2D(
                    gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA,
                    gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255])
                );
            }

            utils.loadImages(
                texturePaths,
                function(images) {
                    for (var texNum = 0; texNum < numTextures; texNum++) {
                        gl.activeTexture(gl.TEXTURE0 + texNum);
                        gl.bindTexture(gl.TEXTURE_2D, textures[texNum]);
                        gl.texImage2D(
                            gl.TEXTURE_2D, 0, gl.RGBA,
                            gl.RGBA, gl.UNSIGNED_BYTE, images[texNum]
                        );
                        gl.generateMipmap(gl.TEXTURE_2D);
                    }
                }
            );
        };

        this.loadShaders = function() {
            noiseProgram = noiseProgram || utils.loadShaders(
                demo.graphics.getOpenGL(),
                noiseShaderPaths,
                ["v_out_pos", "v_normal", "v_tangent", "v_binormal"]
            );
            drawProgram = drawProgram || utils.loadShaders(
                demo.graphics.getOpenGL(),
                drawShaderPaths
            );
        };

        this.initBuffers = function() {
            var gl = demo.graphics.getOpenGL();

            positionBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
            gl.bufferData(
                gl.ARRAY_BUFFER,
                new Float32Array(vertices.length),
                gl.STATIC_DRAW
            );

            normalBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
            gl.bufferData(
                gl.ARRAY_BUFFER,
                new Float32Array(vertices.length),
                gl.STATIC_DRAW
            );

            tangentBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, tangentBuffer);
            gl.bufferData(
                gl.ARRAY_BUFFER,
                new Float32Array(vertices.length),
                gl.STATIC_DRAW
            );

            binormalBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, binormalBuffer);
            gl.bufferData(
                gl.ARRAY_BUFFER,
                new Float32Array(vertices.length),
                gl.STATIC_DRAW
            );

            gl.useProgram(noiseProgram);

            // Initialize position buffer
            var startPosBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, startPosBuffer);
            gl.bufferData(
                gl.ARRAY_BUFFER,
                new Float32Array(vertices),
                gl.STATIC_DRAW
            );
            // Initialize position attribute
            var posAttribLocation = gl.getAttribLocation(
                noiseProgram, "v_in_pos"
            );
            gl.enableVertexAttribArray(posAttribLocation);
            gl.vertexAttribPointer(
                posAttribLocation, 3, gl.FLOAT, false, 0, 0
            );

            sizeLocation = gl.getUniformLocation(noiseProgram, "tile_size");
            gl.uniform2fv(sizeLocation, size);

            seedLocation = gl.getUniformLocation(noiseProgram, "tile_seed");
            gl.uniform2fv(seedLocation, seed);

            gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, positionBuffer);
            gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 1, normalBuffer);
            gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 2, tangentBuffer);
            gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 3, binormalBuffer);

            gl.enable(gl.RASTERIZER_DISCARD);

            gl.beginTransformFeedback(gl.POINTS);
            gl.drawArrays(gl.POINTS, 0, vertices.length / 3);
            gl.endTransformFeedback(gl.POINTS);

            gl.disable(gl.RASTERIZER_DISCARD);

            gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, null);
            gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 1, null);
            gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 2, null);
            gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 3, null);

            gl.deleteBuffer(startPosBuffer);

            //// Sync before accessing buffers
            //var fence = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
            //gl.waitSync(fence, 0, gl.TIMEOUT_IGNORED);
            //// Log new position buffer
            //var tmp1 = new Float32Array(vertices.length).fill(350);
            //gl.bindBuffer(gl.ARRAY_BUFFER, newPosBuffer);
            //gl.getBufferSubData(gl.ARRAY_BUFFER, 0, tmp1);
            //console.log(tmp1);

            // Use new VAO
            vao = gl.createVertexArray();
            gl.bindVertexArray(vao);

            // Bind position buffer
            gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
            // Initialize position attribute
            var posAttribLocation = gl.getAttribLocation(
                drawProgram, "v_model_pos"
            );
            gl.enableVertexAttribArray(posAttribLocation);
            gl.vertexAttribPointer(
                posAttribLocation, 3, gl.FLOAT, false, 0, 0
            );

            // Bind normal buffer
            gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
            // Initialize normal attribute
            var normalAttributeLocation = gl.getAttribLocation(
                drawProgram, "v_model_normal"
            );
            gl.enableVertexAttribArray(normalAttributeLocation);
            gl.vertexAttribPointer(
                normalAttributeLocation, 3, gl.FLOAT, false, 0, 0
            );

            // Bind tangent buffer
            gl.bindBuffer(gl.ARRAY_BUFFER, tangentBuffer);
            // Initialize tangent attribute
            var tangentAttributeLocation = gl.getAttribLocation(
                drawProgram, "v_model_tangent"
            );
            gl.enableVertexAttribArray(tangentAttributeLocation);
            gl.vertexAttribPointer(
                tangentAttributeLocation, 3, gl.FLOAT, false, 0, 0
            );
 
            // Bind binormal buffer
            gl.bindBuffer(gl.ARRAY_BUFFER, binormalBuffer);
            // Initialize binormal attribute
            var binormalAttributeLocation = gl.getAttribLocation(
                drawProgram, "v_model_binormal"
            );
            gl.enableVertexAttribArray(binormalAttributeLocation);
            gl.vertexAttribPointer(
                binormalAttributeLocation, 3, gl.FLOAT, false, 0, 0
            );

            // Initialize index buffer
            indexBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
            gl.bufferData(
                gl.ELEMENT_ARRAY_BUFFER,
                new Uint32Array(indices),
                gl.STATIC_DRAW
            );

            wMatrixLocation = gl.getUniformLocation(
                drawProgram, "v_w_matrix"
            );
            wvpMatrixLocation = gl.getUniformLocation(
                drawProgram, "v_wvp_matrix"
            );
            nwMatrixLocation = gl.getUniformLocation(
                drawProgram, "n_w_matrix"
            );

            lightDirLocation = gl.getUniformLocation(
                drawProgram, 'light_dir'
            );
            lightColorLocation = gl.getUniformLocation(
                drawProgram, 'light_color'
            );

            ambientLowerColorLocation = gl.getUniformLocation(
                drawProgram, 'ambient_lower_color'
            );

            ambientUpperColorLocation = gl.getUniformLocation(
                drawProgram, 'ambient_upper_color'
            );

            skyColorLocation = gl.getUniformLocation(
                drawProgram, 'sky_color'
            );

            obsPosLocation = gl.getUniformLocation(
                drawProgram, 'obs_w_pos'
            );

            samplerLocations = new Array();
            samplerLocations.push(
                gl.getUniformLocation(drawProgram, "color_sampler")
            );
            samplerLocations.push(
                gl.getUniformLocation(drawProgram, "normal_sampler")
            );

            gl.bindVertexArray(null);
        };

        this.init = function() {
            this.loadShaders();
            this.loadModel();
            this.initBuffers();

            // Free data from CPU memory
            vertices = null;
            indices = null;

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

            gl.useProgram(drawProgram);

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

            gl.uniform3fv(lightDirLocation, context.directLightDir);
            gl.uniform3fv(lightColorLocation, context.directLightColor);

            gl.uniform3fv(ambientLowerColorLocation, context.lowerAmbientColor);
            gl.uniform3fv(ambientUpperColorLocation, context.upperAmbientColor);

            gl.uniform3fv(skyColorLocation, context.skyColor);

            gl.uniform3fv(obsPosLocation, context.cameraPos);

            for (var i = 0; i < samplerLocations.length; i++) {
                gl.uniform1i(samplerLocations[i], i);
            }

            for (var i = 0; i < textures.length; i++) {
                gl.activeTexture(gl.TEXTURE0 + i);
                gl.bindTexture(gl.TEXTURE_2D, textures[i]);
            }

            gl.bindVertexArray(vao);

            gl.drawElements(gl.TRIANGLES, numIndices, gl.UNSIGNED_INT, 0);
        };

        this.moveTo = function(newX, newZ) {
            cx = newX;
            cz = newZ;
            wMatrix = utils.makeWorld(cx, 0, cz, 0, 0, 0, 1);
        };

        this.free = function() {
            var gl = demo.graphics.getOpenGL();
            gl.deleteBuffer(positionBuffer);
            gl.deleteBuffer(normalBuffer);
            gl.deleteBuffer(indexBuffer);
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
    };

    pub.free = function() {
        if (textures) {
            for (texture of textures) {
                gl.bindTexture(gl.TEXTURE_2D, null);
                gl.deleteTexture(texture);
            }
        }
    };

    return pub;
})();
