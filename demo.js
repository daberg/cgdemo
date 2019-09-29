var demo = (function() {
    //*** Private demo variables ***//

    var canvas = document.getElementById('demo-canvas');

    var seed = [1, 1].map(val => utils.randomInteger(-16384, 16384));

    var lastTime = 0;
    var timeDelta = 0;

    var demoCamera = new camera.Camera(0, 300, -1200, -25, 180);
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
    var lightColor = [1.0, 1.0, 1.0];

    var drawContext = new (function() {
        this.cameraPos = null;

        this.vMatrix = null;
        this.pMatrix = null;

        this.lightDir = lightDir;
        this.lightColor = lightColor;
    })();

    //*** Helper functions ***//

    function initInteraction() {
        var callbacks = {
            // A key
            65: function() {
                demoCamera.setX(demoCamera.getX() - cameraDelta * 20.0);
            },
            // D key
            68: function() {
                demoCamera.setX(demoCamera.getX() + cameraDelta * 20.0);
            },
            // S key
            83: function() {
                demoCamera.setZ(demoCamera.getZ() - cameraDelta * 20.0);
            },
            // W key
            87: function() {
                demoCamera.setZ(demoCamera.getZ() + cameraDelta * 20.0);
            },
            // Q key
            81: function() {
                demoCamera.setY(demoCamera.getY() - cameraDelta * 20.0);
            },
            // E key
            69: function() {
                demoCamera.setY(demoCamera.getY() + cameraDelta * 20.0);
            },
            // Left arrow key
            37: function() {
                demoCamera.setAngle(
                    demoCamera.getAngle() - cameraDelta * 10.0
                );
            },
            // Right arrow key
            39: function() {
                demoCamera.setAngle(
                    demoCamera.getAngle() + cameraDelta * 10.0
                );
            },
            // Up arrow key
            38: function() {
                demoCamera.setElevation(
                    demoCamera.getElevation() + cameraDelta * 10.0
                );
            },
            // Down arrow key
            40: function() {
                demoCamera.setElevation(
                    demoCamera.getElevation() - cameraDelta * 10.0
                );
            }
        };

        window.addEventListener(
            "keydown",
            function(e) {
                if (e.keyCode in callbacks) {
                    callbacks[e.keyCode]();
                }
            },
            false
        );
    }

    function init() {
        log.logMessage('Initializing');
        log.logMessage("Demo seed: " + seed);

        graphics.init(canvas);

        playerDrone = new drone.Drone();
        playerDrone.init();
        playerDrone.setWorldMatrix(utils.makeWorld(0, 12, 30, 0, 90, 0, 1));

        demoTerrain = terrain.generateTile(tileSize, 2, seed);
        demoTerrain.init();
        demoTerrain.setWorldMatrix(utils.makeWorld(0, 0, 30, 0, 0, 0, 1));

        initInteraction();
    }

    function draw() {
        var gl = graphics.getOpenGL();

        utils.resizeCanvasToDisplaySize(gl.canvas);

        gl.viewport(0.0, 0.0, canvas.clientWidth, canvas.clientHeight);

        gl.clearColor(0.40, 0.70, 0.80, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        var aspectRatio = gl.canvas.width / gl.canvas.height;

        drawContext.pMatrix = utils.makePerspective(
            verticalFov, aspectRatio, nearDist, farDist
        );

        drawContext.vMatrix = utils.makeView(
            demoCamera.getX(),
            demoCamera.getY(),
            demoCamera.getZ(),
            demoCamera.getElevation(),
            demoCamera.getAngle()
        );

        drawContext.cameraPos = demoCamera.getPosition();

        playerDrone.draw(drawContext);
        demoTerrain.draw(drawContext);
    }

    function update() {
        var droneDelta = playerDroneRotSpeed / config.ticksPerSecond;
        var droneRotateMatrix = utils.makeRotateXYZMatrix(droneDelta, 0, 0);

        playerDrone.setWorldMatrix(utils.multiplyMatrices(
            playerDrone.getWorldMatrix(),
            droneRotateMatrix
        ));

        var terrainDelta = 5.0 / config.ticksPerSecond;
        var terrainRotateMatrix = utils.makeRotateXYZMatrix(terrainDelta, 0, 0);

        demoTerrain.setWorldMatrix(utils.multiplyMatrices(
            demoTerrain.getWorldMatrix(),
            terrainRotateMatrix
        ));
    }

    function loop(currTime) {
        if (currTime < lastTime + config.updateTime) {
            requestAnimationFrame(loop);
            return;
        }

        timeDelta += currTime - lastTime;
        lastTime = currTime;

        while (timeDelta >= config.tickTime) {
            update();
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
