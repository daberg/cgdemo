var demo = demo || {};

demo.camera = (function () {
    var pub = {};

    pub.Camera = function(x, y, z, elev, angle) {
        var position = [x, y, z];
        var elev = elev;
        var angle = angle;

        this.getX = function() {
            return position[0];
        };

        this.getY = function() {
            return position[1];
        };

        this.getZ = function() {
            return position[2];
        };

        this.getElevation = function() {
            return elev;
        };

        this.getAngle = function() {
            return angle;
        };

        this.getPosition = function() {
            return position;
        };

        this.setX = function(newX) {
            position[0] = newX;
        };

        this.setY = function(newY) {
            position[1] = newY;
        };

        this.setZ = function(newZ) {
            position[2] = newZ;
        };

        this.setPosition = function(newX, newY, newZ) {
            position[0] = newX;
            position[1] = newY;
            position[2] = newZ;
        };

        this.setElevation = function(newElev) {
            elev = newElev;
        };

        this.setAngle = function(newAngle) {
            angle = newAngle;
        };
    };

    return pub;
})();
