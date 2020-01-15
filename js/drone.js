var demo = demo || {};

demo.drone = (function() {
    var shaderPaths = [
        "drone-vs.glsl",
        "drone-fs.glsl"
    ].map(name => demo.config.shaderDirPath + name);
    
    var texturePaths = [
        "drone-fan.png"
    ].map(name => demo.config.textureDirPath + name);

    var texture;

    var program = null;

    var pub = {};

    pub.Drone = function() {
        var cx = 0;
        var cy = 0;
        var cz = 0;
        var yaw = 0;

        var propSpeed = 100.0;
        var propDelta = propSpeed / demo.config.ticksPerSecond;
        var propRotDir = [1, -1, -1, 1];
        var propYaw = 50;

        var bodyVertices = new Array(3);
        var bodyIndices  = new Array(3);
        var bodyNormals  = new Array(3);

        var propVertices;
        var propIndices;
        var propNormals;
        var propTfs = new Array(4);

        var wMatrix;

        var diffColor = new Array(3);
        var specColor = new Array(3);
        var shininess = new Array(3);

        var bodyVao = new Array(3);
        var propVao;

        var wMatrixLocation;
        var wvpMatrixLocation;
        var nwMatrixLocation;

        var diffColorLocation;
        var specColorLocation;
        var shininessLocation;

        var lightDirLocation;
        var lightColorLocation;

        var obsPosLocation;

        var isPropBoolLocation;
        var propSamplerLocation;

        var gpuBuffers = [];

        this.loadModel = function() {
            utils.get_json(
                demo.config.modelDirPath + 'drone.json',
                function(model) {
                    for (var i = 0; i < 3; i++) {
                        bodyVertices[i] = model.meshes[i+1].vertices;
                        bodyIndices[i] = [].concat.apply(
                            [], model.meshes[i+1].faces
                        );
                        bodyNormals[i] = model.meshes[i+1].normals;

                        diffColor[i] = model.materials[i].properties[1].value;
                        specColor[i] = model.materials[i].properties[4].value;
                        shininess[i] = model.materials[i].properties[6].value;
                    }

                    propVertices = model.meshes[0].vertices;
                    propIndices = [].concat.apply([], model.meshes[0].faces);
                    propNormals = model.meshes[0].normals;

                    propTfs[0] = model.rootnode.children[1].transformation;
                    propTfs[1] = model.rootnode.children[2].transformation;
                    propTfs[2] = model.rootnode.children[3].transformation;
                    propTfs[3] = model.rootnode.children[4].transformation;
                }
            );

            var gl = demo.graphics.getOpenGL();

            texture = gl.createTexture();

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(
                gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA,
                gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255])
            );

            utils.loadImages(
                texturePaths,
                function(images) {
                    gl.activeTexture(gl.TEXTURE0);
                    gl.bindTexture(gl.TEXTURE_2D, texture);
                    gl.texImage2D(
                        gl.TEXTURE_2D, 0, gl.RGBA,
                        gl.RGBA, gl.UNSIGNED_BYTE, images[0]
                    );
                    gl.generateMipmap(gl.TEXTURE_2D);
                }
            );
        };

        this.loadShaders = function() {
            program = program || utils.loadShaders(
                demo.graphics.getOpenGL(),
                shaderPaths
            );
        };

        this.initBuffers = function() {
            var gl = demo.graphics.getOpenGL();

            for (var bodyNum = 0; bodyNum < 3; bodyNum++) {
                // Body VAO
                bodyVao[bodyNum] = gl.createVertexArray();
                gl.bindVertexArray(bodyVao[bodyNum]);

                // Initialize position buffer
                var positionBuffer = gl.createBuffer();
                gpuBuffers.push(positionBuffer);
                gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
                gl.bufferData(
                    gl.ARRAY_BUFFER,
                    new Float32Array(bodyVertices[bodyNum]),
                    gl.STATIC_DRAW
                );
                // Initialize position attribute
                var positionAttributeLocation = gl.getAttribLocation(
                    program, "v_model_pos"
                );
                gl.enableVertexAttribArray(positionAttributeLocation);
                gl.vertexAttribPointer(
                    positionAttributeLocation, 3, gl.FLOAT, false, 0, 0
                );

                // Initialize normal buffer
                var normalBuffer = gl.createBuffer();
                gpuBuffers.push(normalBuffer);
                gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
                gl.bufferData(
                    gl.ARRAY_BUFFER,
                    new Float32Array(bodyNormals[bodyNum]),
                    gl.STATIC_DRAW
                );
                // Initialize normal attribute
                var normalAttributeLocation = gl.getAttribLocation(
                    program, "v_model_normal"
                );
                gl.enableVertexAttribArray(normalAttributeLocation);
                gl.vertexAttribPointer(
                    normalAttributeLocation, 3, gl.FLOAT, false, 0, 0
                );

                // Initialize index buffer
                var indexBuffer = gl.createBuffer();
                gpuBuffers.push(indexBuffer);
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
                gl.bufferData(
                    gl.ELEMENT_ARRAY_BUFFER,
                    new Uint16Array(bodyIndices[bodyNum]),
                    gl.STATIC_DRAW
                );

                gl.bindVertexArray(null);
            }

            // Propeller VAO
            propVao = gl.createVertexArray();
            gl.bindVertexArray(propVao);

            // Initialize position buffer
            var positionBuffer = gl.createBuffer();
            gpuBuffers.push(positionBuffer);
            gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
            gl.bufferData(
                gl.ARRAY_BUFFER,
                new Float32Array(propVertices),
                gl.STATIC_DRAW
            );
            // Initialize position attribute
            var positionAttributeLocation = gl.getAttribLocation(
                program, "v_model_pos"
            );
            gl.enableVertexAttribArray(positionAttributeLocation);
            gl.vertexAttribPointer(
                positionAttributeLocation, 3, gl.FLOAT, false, 0, 0
            );

            // Initialize normal buffer
            var normalBuffer = gl.createBuffer();
            gpuBuffers.push(normalBuffer);
            gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
            gl.bufferData(
                gl.ARRAY_BUFFER,
                new Float32Array(propNormals),
                gl.STATIC_DRAW
            );
            // Initialize normal attribute
            var normalAttributeLocation = gl.getAttribLocation(
                program, "v_model_normal"
            );
            gl.enableVertexAttribArray(normalAttributeLocation);
            gl.vertexAttribPointer(
                normalAttributeLocation, 3, gl.FLOAT, false, 0, 0
            );

            // Initialize index buffer
            var indexBuffer = gl.createBuffer();
            gpuBuffers.push(indexBuffer);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
            gl.bufferData(
                gl.ELEMENT_ARRAY_BUFFER,
                new Uint16Array(propIndices),
                gl.STATIC_DRAW
            );

            gl.bindVertexArray(null);

            // Get uniform locations
            wMatrixLocation = gl.getUniformLocation(program, "v_w_matrix");
            wvpMatrixLocation = gl.getUniformLocation(program, "v_wvp_matrix");
            nwMatrixLocation = gl.getUniformLocation(program, "n_w_matrix");

            diffColorLocation = gl.getUniformLocation(program, 'diff_color');
            specColorLocation = gl.getUniformLocation(program, 'spec_color');
            shininessLocation = gl.getUniformLocation(program, 'shininess');

            lightDirLocation = gl.getUniformLocation(program, 'light_dir');
            lightColorLocation = gl.getUniformLocation(program, 'light_color');

            obsPosLocation = gl.getUniformLocation(program, 'obs_w_pos');

            isPropBoolLocation = gl.getUniformLocation(program, 'is_prop');

            propSamplerLocation = gl.getUniformLocation(program, 'prop_tex');
        };

        this.init = function() {
            this.loadModel();
            this.loadShaders();
            this.initBuffers();

            this.moveTo(0, 0, 0, 0);
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

            gl.uniform3fv(lightDirLocation, context.lightDir);
            gl.uniform3fv(lightColorLocation, context.lightColor);

            gl.uniform3fv(obsPosLocation, context.cameraPos);

            // Draw body
            gl.uniform1f(isPropBoolLocation, 0.0);

            for (var bodyNum = 0; bodyNum < 3; bodyNum++) {
                gl.uniform3fv(diffColorLocation, diffColor[bodyNum]);
                gl.uniform3fv(specColorLocation, specColor[bodyNum]);
                gl.uniform1f(shininessLocation, shininess[bodyNum]);

                gl.bindVertexArray(bodyVao[bodyNum]);
                gl.drawElements(
                    gl.TRIANGLES,
                    bodyIndices[bodyNum].length,
                    gl.UNSIGNED_SHORT,
                    0
                );
            }

            // Draw propellers
            gl.uniform1f(isPropBoolLocation, 1.0);

            gl.uniform1i(propSamplerLocation, 0);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, texture);

            gl.uniform3fv(diffColorLocation, [0, 0, 0]);
            gl.uniform3fv(specColorLocation, [0, 0, 0]);
            gl.uniform1f(shininessLocation, 0);

            gl.bindVertexArray(propVao);

            for (var propNum = 0; propNum < 4; propNum++) {
                var propWMatrix = utils.multiplyMatrices(
                    wMatrix,
                    utils.multiplyMatrices(
                        propTfs[propNum],
                        utils.makeRotateYMatrix(propYaw * propRotDir[propNum])
                    )
                );
                var propWvpMatrix = utils.multiplyMatrices(
                    context.pMatrix,
                    utils.multiplyMatrices(
                        context.vMatrix,
                        propWMatrix
                    )
                );
                var propNwMatrix = utils.makeNormalWorld(propWMatrix);

                gl.uniformMatrix4fv(
                    wMatrixLocation,
                    gl.FALSE,
                    utils.transposeMatrix(propWMatrix)
                );

                gl.uniformMatrix4fv(
                    wvpMatrixLocation,
                    gl.FALSE,
                    utils.transposeMatrix(propWvpMatrix)
                );

                gl.uniformMatrix4fv(
                    nwMatrixLocation,
                    gl.FALSE,
                    utils.transposeMatrix(propNwMatrix)
                );

                gl.drawElements(
                    gl.TRIANGLES, propIndices.length, gl.UNSIGNED_SHORT, 0
                );
            }
        };

        this.moveTo = function(newX, newY, newZ, newYaw) {
            cx = newX;
            cy = newY;
            cz = newZ;
            yaw = (newYaw || 0) % 360.0;
            wMatrix = utils.makeWorld(cx, cy, cz, 0, yaw, 0, 0.2);
        };

        this.move = function(dx, dy, dz, dyaw) {
            this.moveTo(
                cx + dx,
                cy + dy,
                cz + dz,
                yaw + (dyaw || 0)
            );
        };

        this.rotatePropellers = function() {
            propYaw = (propYaw + propDelta) % 360.0;
        };

        this.getYaw = function() {
            return yaw;
        };

        this.getX = function() {
            return cx;
        };

        this.getY = function() {
            return cy;
        };

        this.getZ = function() {
            return cz;
        };

        this.free = function() {
            gl = demo.graphics.getOpenGL();
            for (buffer of gpuBuffers) {
                if (buffer)
                    gl.deleteBuffer(buffer);
            }
        };
    };

    return pub;
})();
