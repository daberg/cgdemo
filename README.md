# WebGL Drone Demo

A WebGL demo featuring a drone flying around in a procedurally-generated rockyish landscape.

Here's a typical view the user might get:
![demo.jpg](https://raw.githubusercontent.com/daberg/cgdemo/master/demo.jpg)

Each time the demo is reloaded, the terrain morphology randomly changes.

The main technical features are briefly listed [here](https://raw.githubusercontent.com/daberg/cgdemo/master/doc/presentation.pdf).

## Controls

The drone is flown around by using the WASD keys to move it on the xz plane (parallel to the ground) and the QE keys to increase or decrease altitude.

## Running

It is not enough to just open `index.html` in a browser, since shaders have been bundled as separate files, and need to be properly hosted using a web server.

This can be conveniently done in a dev setup using the [*webfs*](https://linux.bytesex.org/misc/webfs.html) utility. The script `start-local.sh` can be used to start a unique *webfs* instance serving the demo on port 8080, while `stop-local.sh` can be used to stop it.
