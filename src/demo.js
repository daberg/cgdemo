var demo = demo || {};

demo.main = function() {
    var canvas = document.getElementById('demo-canvas');

    var seed = [1, 1].map(val => utils.randomInteger(-16384, 16384));

    var lastTime = 0;
    var timeDelta = 0;

    var camera = new demo.camera.Camera(0, 100, -300, -25, 180);
    var cameraDist = 250;
    var cameraElev = 100;

    var nearDist = 1;
    var farDist = 10000;
    var verticalFov = 30;

    var drone;

    var droneVel = 100;
    var dronePosDelta = droneVel / demo.config.ticksPerSecond;
    var droneAngVel = 30;
    var droneYawDelta = droneAngVel / demo.config.ticksPerSecond;

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
            camera.getPosition(),
            [drone.getX(), drone.getY(), drone.getZ()],
            [0, 1, 0]
        );

        drawContext.cameraPos = camera.getPosition();

        drone.draw(drawContext);
        terrain.draw(drawContext);
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
