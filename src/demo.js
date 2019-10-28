var demo = demo || {};

demo.main = function() {
    var canvas = document.getElementById('demo-canvas');

    var seed = [1, 1].map(val => utils.randomInteger(-16384, 16384));

    var lastTime = 0;
    var timeDelta = 0;

    var demoCamera = new demo.camera.Camera(0, 100, -300, -25, 180);
    var cameraDelta = 0.5;

    var nearDist = 1;
    var farDist = 10000;
    var verticalFov = 30;

    var drone;
    var droneRotSpeed = 10.0;

    var terrain;
    var tileSize = [1000, 1000];

    var lightAlpha = - utils.degToRad(75);  // Elev
    var lightBeta  = - utils.degToRad(270); // Angle
    var lightDir = [
        Math.cos(lightAlpha) * Math.cos(lightBeta),
        Math.sin(lightAlpha),
        Math.cos(lightAlpha) * Math.sin(lightBeta)
    ];
    var lightColor = [0.7, 0.7, 0.7];

    var drawContext = new (function() {
        this.cameraPos = null;

        this.vMatrix = null;
        this.pMatrix = null;

        this.lightDir = lightDir;
        this.lightColor = lightColor;
    })();

    function init() {
        demo.log.logMessage('Initializing');
        demo.log.logMessage("Demo seed: " + seed);

        demo.graphics.init(canvas);

        drone = new demo.drone.Drone();
        drone.init();

        terrain = demo.terrain.generateTile(tileSize, 2, seed);
        terrain.init();
        terrain.setWorldMatrix(utils.makeWorld(0, 0, 30, 0, 0, 0, 1));
    }

    function draw() {
        var gl = demo.graphics.getOpenGL();

        utils.resizeCanvasToDisplaySize(gl.canvas);

        gl.viewport(0.0, 0.0, canvas.clientWidth, canvas.clientHeight);

        gl.clearColor(0, 0.20, 0.40, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        var aspectRatio = gl.canvas.width / gl.canvas.height;

        drawContext.pMatrix = utils.makePerspective(
            verticalFov,
            aspectRatio,
            nearDist,
            farDist
        );

        drawContext.vMatrix = utils.makeLookAt(
            demoCamera.getPosition(),
            [0, 0, 0],
            [0, 1, 0]
        );

        drawContext.cameraPos = demoCamera.getPosition();

        drone.draw(drawContext);
        terrain.draw(drawContext);
    }

    function tick() {
        drone.rotatePropellers();
    }

    function loop(currTime) {
        if (currTime < lastTime + demo.config.updateTime) {
            requestAnimationFrame(loop);
            return;
        }

        timeDelta += currTime - lastTime;
        lastTime = currTime;

        while (timeDelta >= demo.config.tickTime) {
            tick();
            timeDelta -= demo.config.tickTime;
        }

        draw();

        window.requestAnimationFrame(loop);
    }

    function start() {
        demo.log.logMessage('Starting demo');
        window.requestAnimationFrame(loop);
    }

    init();
    start();
};
