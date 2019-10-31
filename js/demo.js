var demo = demo || {};

demo.main = function() {
    var canvas = document.getElementById('demo-canvas');

    var seed = [1, 1].map(val => utils.randomInteger(-1000, 1000));

    var lastTime = 0;
    var timeDelta = 0;

    var camera = new demo.camera.Camera(0, 100, -300, -25, 180);
    var cameraDist = 150;
    var cameraElev = 35;

    var nearDist = 1;
    var farDist = 10000;
    var verticalFov = 30;

    var drone;

    var droneVel = 75;
    var dronePosDelta = droneVel / demo.config.ticksPerSecond;
    var droneAngVel = 30;
    var droneYawDelta = droneAngVel / demo.config.ticksPerSecond;

    var tileRowLen = 3;
    var tileColLen = 3;
    var tiles = new Array(tileRowLen * tileColLen);
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
            camera.getPosition(),
            [drone.getX(), drone.getY(), drone.getZ()],
            [0, 1, 0]
        );

        drawContext.cameraPos = camera.getPosition();

        drone.draw(drawContext);

        for (tile of tiles) {
            tile.draw(drawContext);
        }
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

        drone.move(dx, dy, dz, dyaw);

        camera.setPosition(
            drone.getX() - droneDir[0] * cameraDist,
            drone.getY() + cameraElev,
            drone.getZ() - droneDir[1] * cameraDist
        );
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
