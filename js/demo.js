var demo = demo || {};

demo.main = function() {
    var canvas = document.getElementById('demo-canvas');

    var seed = [1, 1].map(val => utils.randomInteger(-1000, 1000));

    var lastTime = 0;
    var timeDelta = 0;

    var camera = new demo.camera.Camera();
    var cameraDist = 125;
    var cameraElev = 40;

    var nearDist = 1;
    var farDist = 5000;
    var verticalFov = 50;

    var drone;

    var droneVel = 150;
    var dronePosDelta = droneVel / demo.config.ticksPerSecond;
    var droneAngVel = 30;
    var droneYawDelta = droneAngVel / demo.config.ticksPerSecond;

    var tileRowLen = 5;
    var tileColLen = 5;
    var tiles = new Array(tileRowLen * tileColLen);
    var tileSize = [2000, 2000];

    var walls = [
        (- tileRowLen * tileSize[0] / 5),
        50,
        (- tileColLen * tileSize[1] / 5)
    ];

    var directLightAlpha = utils.degToRad(315); // Elev
    var directLightBeta  = utils.degToRad(15);  // Angle
    var directLightDir = [
        Math.cos(directLightAlpha) * Math.cos(directLightBeta),
        Math.sin(directLightAlpha),
        Math.cos(directLightAlpha) * Math.sin(directLightBeta)
    ];
    var directLightColor = [0.7, 0.7, 0.7];

    var lowerAmbientColor = [0.45, 0.38, 0.30];
    var upperAmbientColor = [0.79, 0.85, 0.82];

    var skyColor = [0.82, 0.98, 0.90];
    upperAmbientColor = utils.desaturate(skyColor, 0.6);

    var running = true;

    var drawContext = new (function() {
        this.cameraPos = null;

        this.vMatrix = null;
        this.pMatrix = null;

        this.directLightDir   = directLightDir;
        this.directLightColor = directLightColor;

        this.skyColor = skyColor;

        this.lowerAmbientColor = lowerAmbientColor;
        this.upperAmbientColor = upperAmbientColor;
    })();

    function init() {
        demo.log.logMessage('Initializing');
        demo.log.logMessage("Demo seed: " + seed);

        demo.graphics.init(canvas);

        window.addEventListener(
            "beforeunload",
            function(e) {
                quit();
            },
            false
        );

        for (var row = 0; row < tileColLen; row++) {
            for (var col = 0; col < tileRowLen; col++) {
                var tileN = tileRowLen * row + col;
                tiles[tileN] = demo.terrain.generateTile(
                    tileSize,
                    5.0,
                    [seed[0] + col, seed[1] + row]
                );
                tiles[tileN].init();
                tiles[tileN].moveTo(
                    tileSize[0] * col - tileSize[0] * (tileRowLen- 1) / 2,
                    tileSize[1] * row - tileSize[1] * (tileColLen - 1) / 2
                );
            }
        }

        drone = new demo.drone.Drone();
        drone.init();
        drone.moveTo(0, 300, 0, 0);
    }

    function draw() {
        var gl = demo.graphics.getOpenGL();

        utils.resizeCanvasToDisplaySize(gl.canvas);

        gl.viewport(0.0, 0.0, canvas.clientWidth, canvas.clientHeight);

        gl.clearColor(skyColor[0], skyColor[1], skyColor[2], 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        var aspectRatio = gl.canvas.width / gl.canvas.height;

        drawContext.pMatrix = utils.makePerspective(
            verticalFov,
            aspectRatio,
            nearDist,
            farDist
        );
        drawContext.vMatrix = utils.makeLookAt(
            camera.getPosition(),
            [drone.getX(), drone.getY(), drone.getZ()],
            [0, 1, 0]
        );
        drawContext.cameraPos = camera.getPosition();

        for (tile of tiles) {
            tile.draw(drawContext);
        }

        // Drone has to be drawn last because it has transparency
        drone.draw(drawContext);
    }

    function tick() {
        drone.rotatePropellers();

        droneDir = [
            - Math.sin(utils.degToRad(drone.getYaw())),
              Math.cos(utils.degToRad(drone.getYaw()))
        ];

        dx = (demo.input.fwd - demo.input.bwd) * dronePosDelta * droneDir[0];
        dy = (demo.input.uwd - demo.input.dwd) * dronePosDelta;
        dz = (demo.input.fwd - demo.input.bwd) * dronePosDelta * droneDir[1];

        dyaw =
            (demo.input.rwd - demo.input.lwd)
            * (demo.input.bwd ? -1 : 1)
            * droneYawDelta;
        
        newX   = drone.getX()   + dx;
        newY   = drone.getY()   + dy;
        newZ   = drone.getZ()   + dz;
        newYaw = drone.getYaw() + dyaw;

        newX = utils.makeEqualIfSmaller(newX, walls[0]);
        newY = utils.makeEqualIfSmaller(newY, walls[1]);
        newZ = utils.makeEqualIfSmaller(newZ, walls[2]);

        newX = utils.makeEqualIfBigger(newX, - walls[0]);
        newZ = utils.makeEqualIfBigger(newZ, - walls[2]);

        drone.moveTo(newX, newY, newZ, newYaw);

        camera.setPosition(
            drone.getX() - droneDir[0] * cameraDist,
            drone.getY() + cameraElev,
            drone.getZ() - droneDir[1] * cameraDist
        );
    }

    function loop(currTime) {
        if (!running) {
            return;
        }

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

    function quit() {
        demo.log.logMessage('Closing');

        // "Notify" closing to main loop in a bad asynchronous way since
        // Javascript is stupid
        running = false;

        gl = demo.graphics.getOpenGL();

        gl.flush();
        gl.finish();

        if (drone)
            drone.free();

        for (tile of tiles) {
            if (tile)
                tile.free();
        }
        demo.terrain.free();

        gl.canvas.width = 1;
        gl.canvas.height = 1;
    }

    init();
    start();
};
