var demo = (function() {
    //*** Private demo variables ***//

    var lastTime = 0;
    var timeDelta = 0;

    var canvas = document.getElementById('demo-canvas');

    var viewMatrix;
    var cameraX = 0;
    var cameraY = 25;
    var cameraZ = 0;
    var cameraElev = -15.0;
    var cameraAngle = 180;
    var cameraDelta = 0.5;

    var perspectiveMatrix;
    var nearDist = 1;
    var farDist = 100;
    var verticalFov = 30;

    var terrainProgram;
    var terrainVao;
    var terrainVertices;
    var terrainIndices;

    var playerDrone;
    var playerDroneRotSpeed = 10.0;

    //*** Helper functions ***//

    function initInteraction() {
        var callbacks = {
            37: function() {
                cameraX -= cameraDelta;            // Left arrow 
            },
            39: function() {
                cameraX += cameraDelta;            // Right arrow 
            },
            38: function() {
                cameraZ -= cameraDelta;            // Up arrow 
            },
            40: function() {
                cameraZ += cameraDelta;            // Down arrow 
            },
            107: function() {
                cameraY += cameraDelta;            // Add 
            },
            107: function() {
                cameraY -= cameraDelta;            // Subtract 
            },
            65: function() {
                cameraAngle -= cameraDelta * 10.0; // a 
            },
            68: function() {
                cameraAngle += cameraDelta * 10.0; // d 
            },
            87: function() {
                cameraElev += cameraDelta * 10.0;  // w 
            },
            83: function() {
                cameraElev -= cameraDelta * 10.0;  // s 
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

        graphics.init(canvas);

        playerDrone = new drone.Drone();
        playerDrone.init();
        playerDrone.setWorldMatrix(utils.MakeWorld(0, 12, 30, 0, 90, 0, 1));

        initInteraction();
    }

    function draw() {
        var gl = graphics.getContext();

        utils.resizeCanvasToDisplaySize(gl.canvas);

        gl.viewport(0.0, 0.0, canvas.clientWidth, canvas.clientHeight);

        gl.clearColor(0.85, 0.85, 0.85, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        var aspectRatio = gl.canvas.width / gl.canvas.height;

        var perspectiveMatrix = utils.MakePerspective(verticalFov, aspectRatio, nearDist, farDist);
        var viewMatrix = utils.MakeView(cameraX, cameraY, cameraZ, cameraElev, cameraAngle);

        playerDrone.draw(viewMatrix, perspectiveMatrix);
    }

    function update() {
        var droneDelta = playerDroneRotSpeed / config.ticksPerSecond;
        var droneRotateMatrix = utils.MakeRotateXYZMatrix(droneDelta, 0, 0);

        playerDrone.setWorldMatrix(utils.multiplyMatrices(
            playerDrone.getWorldMatrix(),
            droneRotateMatrix
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
