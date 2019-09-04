// Define global variables
var gl = null;
var program;

var canvas = document.getElementById('demo-canvas');

var perspectiveMatrix;
var viewMatrix;
var droneWorldMatrix;
var matrixLocation;

var nearDist = 1;
var farDist = 100;
var verticalFov = 30;

var cameraX = 0;
var cameraY = 25;
var cameraZ = 0;
var cameraElev = -15.0;
var cameraAngle = 180;
var cameraDelta = 0.5;

var droneVao;
var droneRotDelta = 50.0;

var maxFps = 60
var loopTime = 1000.0 / maxFps;
var tickTime = 1000.0 / 60.0;
var lastTime = 0;
var timeDelta = 0;

var vertexShaderSource = `#version 300 es

in vec3 v_position;
in vec3 v_color;

uniform mat4 matrix;

out vec3 f_color;

void main() {
  f_color = v_color;
  gl_Position = matrix * vec4(v_position, 1.0);
}
`;

var fragmentShaderSource = `#version 300 es

precision mediump float;

in vec3 f_color;

out vec4 out_color;

void main() {
  out_color = vec4(f_color,1.0);
}
`;

var droneVertices = [
     0.0,  20.0,  0.0,
    -2.0,  0.0,   2.0,
     2.0,  0.0,   2.0,
     2.0,  0.0,  -2.0,
    -2.0,  0.0,  -2.0
];

var droneColors = [
    1.0, 1.0, 0.0,
    1.0, 0.0, 0.0,
    0.0, 1.0, 0.0,
    0.0, 0.0, 1.0,
    0.0, 1.0, 1.0
];

var droneIndices = [
    0, 1, 2,
    0, 2, 3,
    0, 3, 4,
    0, 4, 1,
    4, 3, 1,
    3, 2, 1
];

function log(msg) {
    console.log(msg);
}

function logError(err) {
    log(err.name + ": " + err.message);
}

function loadModel() {
    droneWorldMatrix = utils.MakeWorld(0, 12, 30, 0, 90, 0, 1);
}

function loadShaders() {
    var vertexShader = utils.createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    var fragmentShader = utils.createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    program = utils.createProgram(gl, vertexShader, fragmentShader);
    gl.useProgram(program);
}

function initBuffers() {
    droneVao = gl.createVertexArray();
    gl.bindVertexArray(droneVao);

    var positionAttributeLocation = gl.getAttribLocation(program, "v_position");
    var positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(droneVertices), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);

    var colorAttributeLocation = gl.getAttribLocation(program, "v_color");
    var colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(droneColors), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(colorAttributeLocation);
    gl.vertexAttribPointer(colorAttributeLocation, 3, gl.FLOAT, false, 0, 0);

    indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(droneIndices), gl.STATIC_DRAW);

    matrixLocation = gl.getUniformLocation(program, "matrix");
}

function initInteraction(){
    var keyFunction =function(e) {
        if (e.keyCode == 37) {  // Left arrow
            cameraX-=cameraDelta;
        }
        if (e.keyCode == 39) {  // Right arrow
            cameraX+=cameraDelta;
        }
        if (e.keyCode == 38) {  // Up arrow
            cameraZ-=cameraDelta;
        }
        if (e.keyCode == 40) {  // Down arrow
            cameraZ+=cameraDelta;
        }
        if (e.keyCode == 107) { // Add
            cameraY+=cameraDelta;
        }
        if (e.keyCode == 109) { // Subtract
            cameraY-=cameraDelta;
        }
        if (e.keyCode == 65) {  // a
            cameraAngle-=cameraDelta*10.0;
        }
        if (e.keyCode == 68) {  // d
            cameraAngle+=cameraDelta*10.0;
        }
        if (e.keyCode == 87) {  // w
            cameraElev+=cameraDelta*10.0;
        }
        if (e.keyCode == 83) {  // s
            cameraElev-=cameraDelta*10.0;
        }
    }
    window.addEventListener("keydown", keyFunction, false);
}

function init() {
    log('Initializing...');

    gl = canvas.getContext('webgl2');
    if (!gl) {
        alert('Your browser does not support WebGL2 :(');
        throw new Error('WebGL2 not supported');
    }

    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);

    loadModel();
    loadShaders();

    initBuffers();
    initInteraction();
}

function update() {
    var droneDelta = (droneRotDelta * tickTime) / 1000.0;

    var droneRotateMatrix = utils.MakeRotateXYZMatrix(droneDelta, 0, 0);
    droneWorldMatrix = utils.multiplyMatrices(droneWorldMatrix, droneRotateMatrix);
}

function draw() {
    utils.resizeCanvasToDisplaySize(gl.canvas);

    gl.viewport(0.0, 0.0, canvas.clientWidth, canvas.clientHeight);

    gl.clearColor(0.85, 0.85, 0.85, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var aspectRatio = gl.canvas.width / gl.canvas.height;

    var perspectiveMatrix = utils.MakePerspective(verticalFov, aspectRatio, nearDist, farDist);
    var viewMatrix = utils.MakeView(cameraX, cameraY, cameraZ, cameraElev, cameraAngle);

    var droneWvMatrix = utils.multiplyMatrices(viewMatrix, droneWorldMatrix);
    var droneWvpMatrix = utils.multiplyMatrices(perspectiveMatrix, droneWvMatrix);

    gl.uniformMatrix4fv(matrixLocation, gl.FALSE, utils.transposeMatrix(droneWvpMatrix));
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bindVertexArray(droneVao);
    gl.drawElements(gl.TRIANGLES, droneIndices.length, gl.UNSIGNED_SHORT, 0);
}

function loop(currTime) {
    if (currTime < lastTime + loopTime) {
        requestAnimationFrame(loop);
        return;
    }

    timeDelta += currTime - lastTime;

    while (timeDelta >= tickTime) {
        update();
        timeDelta -= tickTime;
    }

    lastTime = currTime;

    draw();

    window.requestAnimationFrame(loop);
}

function start() {
    log('Starting demo...');
    window.requestAnimationFrame(loop);
}

function main() {
    try {
        init();
        start();
    }
    catch (err) {
        logError(err);
    }
}

// Initialize and run the demo
main();
