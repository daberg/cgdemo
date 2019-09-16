var utils = {
    loadFile: function (url, data, callback, errorCallback) {
        var request = new XMLHttpRequest();
        request.open('GET', url, false);

        // Hook the event that gets called as the request progresses
        request.onreadystatechange = function () {
            // If the request was successful
            if (request.readyState == 4 && request.status == 200) {
                callback(request.responseText, data)
            }
            else {
                errorCallback(url);
            }
        };

        request.send(null);
    },

    loadFiles: function (urls, callback, errorCallback) {
        var numUrls = urls.length;
        var numComplete = 0;
        var result = [];
        var failedUrls = [];

        function singleCallback(text, urlIndex) {
            result[urlIndex] = text;
            numComplete++;
        }

        function singleErrorCallback(url) {
            failedUrls.push(url);
        }

        for (var i = 0; i < numUrls; i++) {
            this.loadFile(urls[i], i, singleCallback, singleErrorCallback);
        }

        if (numComplete == numUrls) {
            callback(result);
        }
        else {
            errorCallback(failedUrls);
        }
    },

    /** Shaders utils **/

    createShader: function(gl, type, source) {
        var shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
        if (success) {
            return shader;
        }
        else {
            log.logError(gl.getShaderInfoLog(shader));
            throw new Error("Could not compile shader");
        }
    },

    createProgram: function(gl, vertexShader, fragmentShader) {
        var program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        var success = gl.getProgramParameter(program, gl.LINK_STATUS);
        if (success) {
            return program;
        }
        else {
            throw new Error("Could not link program");
            log.logError(gl.getProgramInfoLog(program));
            gl.deleteProgram(program);
            return undefined;
        }
    },

    loadShaders: function(gl, shaderPaths) {
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
            throw new Error("Could not load shaders");
        }

        var vertexShader = utils.createShader(
            gl,
            gl.VERTEX_SHADER,
            vShaderCode
        );
        var fragmentShader = utils.createShader(
            gl,
            gl.FRAGMENT_SHADER,
            fShaderCode
        );

        return utils.createProgram(gl, vertexShader, fragmentShader);
    },

    resizeCanvasToDisplaySize: function(canvas, multiplier) {
      multiplier = multiplier || 1;
      const width  = canvas.clientWidth  * multiplier | 0;
      const height = canvas.clientHeight * multiplier | 0;
      if (canvas.width !== width ||  canvas.height !== height) {
        canvas.width  = width;
        canvas.height = height;
        return true;
      }
      return false;
    },

    // Function to load a 3D model in JSON format
    get_json: function(url, func) {
        var xmlHttp = new XMLHttpRequest();
        xmlHttp.open("GET", url, false); // if true == asynchronous...
        xmlHttp.onreadystatechange = function() {
            if (xmlHttp.readyState == 4 && xmlHttp.status==200) {
                // The file is loaded. Parse it as JSON and launch function
                func(JSON.parse(xmlHttp.responseText));
            }
        };
        // Send the request
        xmlHttp.send();
    },

    // Function to convert decimal value of colors
    decimalToHex: function(d, padding) {
        var hex = Number(d).toString(16);
        padding =
            typeof (padding) === "undefined"
            || padding === null ? padding = 2 : padding;

        while (hex.length < padding) {
            hex = "0" + hex;
        }

        return hex;
    },

    /** Texture utils **/

    getTexture: function(context, image_URL) {
        var image=new Image();
        image.webglTexture=false;
        image.isLoaded=false;

        image.onload=function(e) {

            var texture=context.createTexture();

            context.bindTexture(context.TEXTURE_2D, texture);

            context.texImage2D(
                context.TEXTURE_2D,
                0,
                context.RGBA,
                context.RGBA,
                context.UNSIGNED_BYTE,
                image
            );
            // Context.pixelStorei(context.UNPACK_FLIP_Y_WEBGL, 1);
            context.texParameteri(
                context.TEXTURE_2D,
                context.TEXTURE_WRAP_S,
                context.CLAMP_TO_EDGE
            );
            context.texParameteri(
                context.TEXTURE_2D,
                context.TEXTURE_WRAP_T,
                context.CLAMP_TO_EDGE
            );
            context.texParameteri(
                context.TEXTURE_2D,
                context.TEXTURE_MAG_FILTER,
                context.LINEAR
            );
            context.texParameteri(
                context.TEXTURE_2D,
                context.TEXTURE_MIN_FILTER,
                context.NEAREST_MIPMAP_LINEAR
            );
            context.generateMipmap(context.TEXTURE_2D);

            context.bindTexture(context.TEXTURE_2D, null);
            image.webglTexture=texture;
            image.isLoaded=true;
        };

        image.src=image_URL;

        return image;
    },

    isPowerOfTwo: function(x) {
        return (x & (x - 1)) == 0;
    },

    nextHighestPowerOfTwo: function(x) {
        --x;
        for (var i = 1; i < 32; i <<= 1) {
            x = x | x >> i;
        }
        return x + 1;
    },

    /* Math */

    isInteger: function(number) {
        return number % 1 === 0;
    },

    randomInteger: function(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    degToRad: function(angle){
        return(angle*Math.PI/180);
    },

    identityMatrix: function() {
        return [1,0,0,0,
                0,1,0,0,
                0,0,1,0,
                0,0,0,1];
    },

    identityMatrix3: function() {
        return [1,0,0,
                0,1,0,
                0,0,1];
    },

    // Returns the 3x3 submatrix from a Matrix4x4
    sub3x3from4x4: function(m){
        out = [];
        out[0] = m[0]; out[1] = m[1]; out[2] = m[2];
        out[3] = m[4]; out[4] = m[5]; out[5] = m[6];
        out[6] = m[8]; out[7] = m[9]; out[8] = m[10];
        return out;
    },

    // Multiply the mat3 with a vec3.
    multiplyMatrix3Vector3: function(m, a) {

        out = [];
        var x = a[0], y = a[1], z = a[2];
        out[0] = x * m[0] + y * m[1] + z * m[2];
        out[1] = x * m[3] + y * m[4] + z * m[5];
        out[2] = x * m[6] + y * m[7] + z * m[8];
        return out;
    },

    // Transpose the values of a mat3
    transposeMatrix3 : function(a) {

        out = [];

        out[0] = a[0];
        out[1] = a[3];
        out[2] = a[6];
        out[3] = a[1];
        out[4] = a[4];
        out[5] = a[7];
        out[6] = a[2];
        out[7] = a[5];
        out[8] = a[8];

        return out;
    },

    invertMatrix3: function(m){
        out = [];

        var a00 = m[0], a01 = m[1], a02 = m[2],
            a10 = m[3], a11 = m[4], a12 = m[5],
            a20 = m[6], a21 = m[7], a22 = m[8],

            b01 = a22 * a11 - a12 * a21,
            b11 = -a22 * a10 + a12 * a20,
            b21 = a21 * a10 - a11 * a20,

            // Calculate the determinant
            det = a00 * b01 + a01 * b11 + a02 * b21;

        if (!det) {
            return null;
        }
        det = 1.0 / det;

        out[0] = b01 * det;
        out[1] = (-a22 * a01 + a02 * a21) * det;
        out[2] = (a12 * a01 - a02 * a11) * det;
        out[3] = b11 * det;
        out[4] = (a22 * a00 - a02 * a20) * det;
        out[5] = (-a12 * a00 + a02 * a10) * det;
        out[6] = b21 * det;
        out[7] = (-a21 * a00 + a01 * a20) * det;
        out[8] = (a11 * a00 - a01 * a10) * det;

        return out;
    },

    // Requires as a parameter a 4x4 matrix (array of 16 values)
    invertMatrix: function(m){
        var out = [];
        var inv = [];
        var det, i;

        inv[0] =
            + m[5]  * m[10] * m[15]
            - m[5]  * m[11] * m[14]
            - m[9]  * m[6]  * m[15]
            + m[9]  * m[7]  * m[14]
            + m[13] * m[6]  * m[11]
            - m[13] * m[7]  * m[10];

        inv[4] =
            - m[4]  * m[10] * m[15]
            + m[4]  * m[11] * m[14]
            + m[8]  * m[6]  * m[15]
            - m[8]  * m[7]  * m[14]
            - m[12] * m[6]  * m[11]
            + m[12] * m[7]  * m[10];

        inv[8] =
            + m[4]  * m[9]  * m[15]
            - m[4]  * m[11] * m[13]
            - m[8]  * m[5]  * m[15]
            + m[8]  * m[7]  * m[13]
            + m[12] * m[5]  * m[11]
            - m[12] * m[7]  * m[9];

        inv[12] =
            - m[4]  * m[9]  * m[14]
            + m[4]  * m[10] * m[13]
            + m[8]  * m[5]  * m[14]
            - m[8]  * m[6]  * m[13]
            - m[12] * m[5]  * m[10]
            + m[12] * m[6]  * m[9];

        inv[1] =
            - m[1]  * m[10] * m[15]
            + m[1]  * m[11] * m[14]
            + m[9]  * m[2]  * m[15]
            - m[9]  * m[3]  * m[14]
            - m[13] * m[2]  * m[11]
            + m[13] * m[3]  * m[10];

        inv[5] =
            + m[0]  * m[10] * m[15]
            - m[0]  * m[11] * m[14]
            - m[8]  * m[2]  * m[15]
            + m[8]  * m[3]  * m[14]
            + m[12] * m[2]  * m[11]
            - m[12] * m[3]  * m[10];

        inv[9] =
            - m[0]  * m[9]  * m[15]
            + m[0]  * m[11] * m[13]
            + m[8]  * m[1]  * m[15]
            - m[8]  * m[3]  * m[13]
            - m[12] * m[1]  * m[11]
            + m[12] * m[3]  * m[9];

        inv[13] =
            + m[0]  * m[9]  * m[14]
            - m[0]  * m[10] * m[13]
            - m[8]  * m[1]  * m[14]
            + m[8]  * m[2]  * m[13]
            + m[12] * m[1]  * m[10]
            - m[12] * m[2]  * m[9];

        inv[2] =
            + m[1]  * m[6] * m[15]
            - m[1]  * m[7] * m[14]
            - m[5]  * m[2] * m[15]
            + m[5]  * m[3] * m[14]
            + m[13] * m[2] * m[7]
            - m[13] * m[3] * m[6];

        inv[6] =
            - m[0]  * m[6] * m[15]
            + m[0]  * m[7] * m[14]
            + m[4]  * m[2] * m[15]
            - m[4]  * m[3] * m[14]
            - m[12] * m[2] * m[7]
            + m[12] * m[3] * m[6];

        inv[10] =
            + m[0]  * m[5] * m[15]
            - m[0]  * m[7] * m[13]
            - m[4]  * m[1] * m[15]
            + m[4]  * m[3] * m[13]
            + m[12] * m[1] * m[7]
            - m[12] * m[3] * m[5];

        inv[14] =
            - m[0]  * m[5] * m[14]
            + m[0]  * m[6] * m[13]
            + m[4]  * m[1] * m[14]
            - m[4]  * m[2] * m[13]
            - m[12] * m[1] * m[6]
            + m[12] * m[2] * m[5];

        inv[3] =
            - m[1] * m[6] * m[11]
            + m[1] * m[7] * m[10]
            + m[5] * m[2] * m[11]
            - m[5] * m[3] * m[10]
            - m[9] * m[2] * m[7]
            + m[9] * m[3] * m[6];

        inv[7] =
            + m[0] * m[6] * m[11]
            - m[0] * m[7] * m[10]
            - m[4] * m[2] * m[11]
            + m[4] * m[3] * m[10]
            + m[8] * m[2] * m[7]
            - m[8] * m[3] * m[6];

        inv[11] =
            - m[0] * m[5] * m[11]
            + m[0] * m[7] * m[9]
            + m[4] * m[1] * m[11]
            - m[4] * m[3] * m[9]
            - m[8] * m[1] * m[7]
            + m[8] * m[3] * m[5];

        inv[15] =
            + m[0] * m[5] * m[10]
            - m[0] * m[6] * m[9]
            - m[4] * m[1] * m[10]
            + m[4] * m[2] * m[9]
            + m[8] * m[1] * m[6]
            - m[8] * m[2] * m[5];

        det = m[0] * inv[0] + m[1] * inv[4] + m[2] * inv[8] + m[3] * inv[12];

        if (det == 0)
            return out = this.identityMatrix();

        det = 1.0 / det;

        for (i = 0; i < 16; i++){
            out[i] = inv[i] * det;
        }

        return out;
    },

    copy: function(src, dst) {
        dst = dst || new Float32Array(16);

        dst[ 0] = src[ 0];
        dst[ 1] = src[ 1];
        dst[ 2] = src[ 2];
        dst[ 3] = src[ 3];
        dst[ 4] = src[ 4];
        dst[ 5] = src[ 5];
        dst[ 6] = src[ 6];
        dst[ 7] = src[ 7];
        dst[ 8] = src[ 8];
        dst[ 9] = src[ 9];
        dst[10] = src[10];
        dst[11] = src[11];
        dst[12] = src[12];
        dst[13] = src[13];
        dst[14] = src[14];
        dst[15] = src[15];

        return dst;
    },

    transposeMatrix: function(m){
        var out = [];

        var row, column, row_offset;

        row_offset=0;
        for (row = 0; row < 4; ++row) {
            row_offset = row * 4;
            for (column = 0; column < 4; ++column){
                out[row_offset + column] = m[row + column * 4];
              }
        }

        return out;
    },

    /* Matrix product */
    multiplyMatrices: function(m1, m2){
        var out = [];

        var row, column, row_offset;

        row_offset=0;
        for (row = 0; row < 4; ++row) {
            row_offset = row * 4;
            for (column = 0; column < 4; ++column){
                out[row_offset + column] =
                    (m1[row_offset + 0] * m2[column + 0]) +
                    (m1[row_offset + 1] * m2[column + 4]) +
                    (m1[row_offset + 2] * m2[column + 8]) +
                    (m1[row_offset + 3] * m2[column + 12]);
              }
        }
        return out;
    },

    /* Mutiplies a matrix by a vector */
    multiplyMatrixVector: function(m, v){
        var out = [];

        var row, row_offset;

        row_offset=0;
        for (row = 0; row < 4; ++row) {
            row_offset = row * 4;

            out[row] =
                (m[row_offset + 0] * v[0]) +
                (m[row_offset + 1] * v[1]) +
                (m[row_offset + 2] * v[2]) +
                (m[row_offset + 3] * v[3]);

        }
        return out;
    },

    /** Model matrix operations **/

    // Create a transform matrix for a translation of ({dx}, {dy}, {dz}).
    makeTranslateMatrix: function(dx, dy, dz) {
        var out = this.identityMatrix();

        out[3]  = dx;
        out[7]  = dy;
        out[11] = dz;
        return out;
    },

    // Create a transform matrix for a rotation of {a} along the X axis.
    makeRotateXMatrix: function(a) {
        var out = this.identityMatrix();

        var adeg = this.degToRad(a);
        var c = Math.cos(adeg);
        var s = Math.sin(adeg);

        out[5] = out[10] = c;
        out[6] = -s;
        out[9] = s;

        return out;
    },

    // Create a transform matrix for a rotation of {a} along the Y axis.
    makeRotateYMatrix: function(a) {

        var out = this.identityMatrix();

        var adeg = this.degToRad(a);

        var c = Math.cos(adeg);
        var s = Math.sin(adeg);

        out[0] = out[10] = c;
        out[2] = -s;
        out[8] = s;

        return out;
    },

    // Create a transform matrix for a rotation of {a} along the Z axis.
    makeRotateZMatrix: function(a) {

        var out = this.identityMatrix();

        var adeg = this.degToRad(a);
        var c = Math.cos(adeg);
        var s = Math.sin(adeg);

        out[0] = out[5] = c;
        out[4] = -s;
        out[1] = s;

        return out;
    },

    // Creates a transform matrix for proportional scale
    makeScaleMatrix: function(s) {

        var out = this.identityMatrix();

        out[0] = out[5] = out[10] = s;

        return out;
    },

    // Creates a world matrix for an object
    makeRotateXYZMatrix: function(rx, ry, rz, s){

        var Rx = this.makeRotateXMatrix(ry);
        var Ry = this.makeRotateYMatrix(rx);
        var Rz = this.makeRotateZMatrix(rz);

        out = this.multiplyMatrices(Ry, Rz);
        out = this.multiplyMatrices(Rx, out);

        return out;
    },

    /** Projection Matrix operations **/

    // Creates a world matrix for an object.
    makeWorld: function(tx, ty, tz, rx, ry, rz, s){

        var Rx = this.makeRotateXMatrix(ry);
        var Ry = this.makeRotateYMatrix(rx);
        var Rz = this.makeRotateZMatrix(rz);
        var S  = this.makeScaleMatrix(s);
        var T =  this.makeTranslateMatrix(tx, ty, tz);

        out = this.multiplyMatrices(Rz, S);
        out = this.multiplyMatrices(Ry, out);
        out = this.multiplyMatrices(Rx, out);
        out = this.multiplyMatrices(T, out);

        return out;
    },

    normalize: function(v, dst) {
        dst = dst || new Float32Array(3);
        var length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);

        // make sure we don't divide by 0.
        if (length > 0.00001) {
          dst[0] = v[0] / length;
          dst[1] = v[1] / length;
          dst[2] = v[2] / length;
        }

        return dst;
    },

    subtractVectors: function(a, b, dst) {
        dst = dst || new Float32Array(3);
        dst[0] = a[0] - b[0];
        dst[1] = a[1] - b[1];
        dst[2] = a[2] - b[2];
        return dst;
    },

    cross: function(a, b, dst) {
        dst = dst || new Float32Array(3);
        dst[0] = a[1] * b[2] - a[2] * b[1];
        dst[1] = a[2] * b[0] - a[0] * b[2];
        dst[2] = a[0] * b[1] - a[1] * b[0];
        return dst;
    },

    lookAt: function(cameraPosition, target, up, dst) {
        dst = dst || new Float32Array(16);
        var zAxis = this.normalize(
            this.subtractVectors(cameraPosition, target));
        var xAxis = this.normalize(this.cross(up, zAxis));
        var yAxis = this.normalize(this.cross(zAxis, xAxis));

        dst[ 0] = xAxis[0];
        dst[ 1] = yAxis[0];
        dst[ 2] = zAxis[0];
        dst[ 3] = cameraPosition[0];
        dst[ 4] = xAxis[1];
        dst[ 5] = yAxis[1];
        dst[ 6] = zAxis[1];
        dst[ 7] = cameraPosition[1];
        dst[ 8] = xAxis[2];
        dst[ 9] = yAxis[2];
        dst[10] = zAxis[2];
        dst[11] = cameraPosition[2];
        dst[12] = 0.0;
        dst[13] = 0.0;
        dst[14] = 0.0;
        dst[15] = 1.0;

        return dst;
    },

    // Creates a view matrix. The camera is centerd in ({cx}, {cy}, {cz}).
    // It looks {ang} degrees on y axis, and {elev} degrees on the x axis.
    makeView: function(cx, cy, cz, elev, ang) {

        var T = [];
        var Rx = [];
        var Ry = [];
        var tmp = [];
        var out = [];

        T =  this.makeTranslateMatrix(-cx, -cy, -cz);
        Rx = this.makeRotateXMatrix(-elev);
        Ry = this.makeRotateYMatrix(-ang);

        tmp = this.multiplyMatrices(Ry, T);
        out = this.multiplyMatrices(Rx, tmp);

        return out;
    },

    // Creates the perspective projection matrix. The matrix is returned.
    // {fovy} contains the vertical field-of-view in degrees.  {a} is the
    // aspect ratio.  {n} is the distance of the near plane, and {f} is the far
    // plane.
    makePerspective: function(fovy, a, n, f) {

        var perspective = this.identityMatrix();

        // Store {fovy/2} in radiants
        var halfFovyRad = this.degToRad(fovy/2);

        // Cotangent of {fov/2}
        var ct = 1.0 / Math.tan(halfFovyRad);

        perspective[0] = ct / a;
        perspective[5] = ct;
        perspective[10] = (f + n) / (n - f);
        perspective[11] = 2.0 * f * n / (n - f);
        perspective[14] = -1.0;
        perspective[15] = 0.0;

        return perspective;
    }
}
