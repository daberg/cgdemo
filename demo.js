var demo = (function() {
    //*** Private demo variables ***//

    var seed;

    var lastTime = 0;
    var timeDelta = 0;

    var canvas = document.getElementById('demo-canvas');

    var viewMatrix;
    var cameraX = 0;
    var cameraY = 300;
    var cameraZ = -1200;
    var cameraElev = -25.0;
    var cameraAngle = 180;
    var cameraDelta = 0.5;

    var perspectiveMatrix;
    var nearDist = 1;
    var farDist = 10000;
    var verticalFov = 30;

    var playerDrone;
    var playerDroneRotSpeed = 10.0;

    var demoTerrain;
    var tileSize = [1000, 1000];

    var lightAlpha = - utils.degToRad(75); // Elev
    var lightBeta  = - utils.degToRad(270); // Angle

    var lightDir = [
        Math.cos(lightAlpha) * Math.cos(lightBeta),
        Math.sin(lightAlpha),
        Math.cos(lightAlpha) * Math.sin(lightBeta)
    ];
    var lightColor = [1.0, 1.0, 1.0];

    var seed = [1, 1].map(val => utils.randomInteger(-16384, 16384));

    //*** Helper functions ***//

    function initInteraction() {
        var callbacks = {
            65: function() {
                cameraX -= cameraDelta * 20.0;      // A
            },
            68: function() {
                cameraX += cameraDelta * 20.0;      // D
            },
            83: function() {
                cameraZ -= cameraDelta * 20.0;      // S
            },
            87: function() {
                cameraZ += cameraDelta * 20.0;      // W
            },
            81: function() {
                cameraY -= cameraDelta * 20.0;      // Q
            },
            69: function() {
                cameraY += cameraDelta * 20.0;      // E
            },
            37: function() {
                cameraAngle -= cameraDelta * 10.0; // Left arrow
            },
            39: function() {
                cameraAngle += cameraDelta * 10.0; // Right arrow
            },
            38: function() {
                cameraElev += cameraDelta * 10.0;  // Up arrow
            },
            40: function() {
                cameraElev -= cameraDelta * 10.0;  // Down arrow
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
        var gl = graphics.getContext();

        utils.resizeCanvasToDisplaySize(gl.canvas);

        gl.viewport(0.0, 0.0, canvas.clientWidth, canvas.clientHeight);

        gl.clearColor(0.40, 0.70, 0.80, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        var aspectRatio = gl.canvas.width / gl.canvas.height;

        var perspectiveMatrix = utils.makePerspective(
            verticalFov,
            aspectRatio,
            nearDist,
            farDist
        );
        var viewMatrix = utils.makeView(
            cameraX,
            cameraY,
            cameraZ,
            cameraElev,
            cameraAngle
        );

        playerDrone.draw(viewMatrix, perspectiveMatrix);
        demoTerrain.draw(viewMatrix, perspectiveMatrix, lightDir, lightColor);
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
