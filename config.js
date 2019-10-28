var config = {};

// Ideally should be the same
// Lower maxFps to reduce hardware load
config.ticksPerSecond = 60;
config.maxFps         = 60;

config.tickTime   = 1000.0 / config.ticksPerSecond;
config.updateTime = 1000.0 / config.maxFps;

config.modelDirPath = document.URL + "models/";
config.shaderDirPath = document.URL + "shaders/";

config.debugging = true;
