var demo = (function() {
    //*** Private demo variables ***//

    var canvas = document.getElementById('demo-canvas');

    var seed = [1, 1].map(val => utils.randomInteger(-16384, 16384));

    var lastTime = 0;
    var timeDelta = 0;

    var demoCamera = new camera.Camera(0, 100, -300, -25, 180);
    var cameraDelta = 0.5;

    var nearDist = 1;
    var farDist = 10000;
    var verticalFov = 30;

    var playerDrone;
    var playerDroneRotSpeed = 10.0;

    var demoTerrain;
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

    //*** Helper functions ***//

    function init() {
        log.logMessage('Initializing');
        log.logMessage("Demo seed: " + seed);

        graphics.init(canvas);

        playerDrone = new drone.Drone();
        playerDrone.init();

        demoTerrain = terrain.generateTile(tileSize, 2, seed);
        demoTerrain.init();
        demoTerrain.setWorldMatrix(utils.makeWorld(0, 0, 30, 0, 0, 0, 1));
    }

    function draw() {
        var gl = graphics.getOpenGL();

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

        playerDrone.draw(drawContext);
        demoTerrain.draw(drawContext);
    }

    function tick() {
        var droneDelta = playerDroneRotSpeed / config.ticksPerSecond;
        playerDrone.rotatePropellers();
        //playerDrone.rotate(droneDelta);
    }

    function loop(currTime) {
        if (currTime < lastTime + config.updateTime) {
            requestAnimationFrame(loop);
            return;
        }

        timeDelta += currTime - lastTime;
        lastTime = currTime;

        while (timeDelta >= config.tickTime) {
            tick();
            timeDelta -= config.tickTime;
        }

        draw();

        window.requestAnimationFrame(loop);
    }

    function start() {
        log.logMessage('Starting demo');
        window.requestAnimationFrame(loop);
    }

    var pub = {};

    pub.main = function() {
        init();
        start();
    };

    return pub;
})();

// Initialize and run the demo
demo.main();
