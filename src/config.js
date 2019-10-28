var demo = demo || {};

demo.config = {};

// Should ideally be the same
// Lower maxFps to reduce hardware load
demo.config.ticksPerSecond = 60;
demo.config.maxFps         = 60;

demo.config.tickTime   = 1000.0 / demo.config.ticksPerSecond;
demo.config.updateTime = 1000.0 / demo.config.maxFps;

demo.config.modelDirPath  = document.URL + "models/";
demo.config.shaderDirPath = document.URL + "shaders/";

demo.config.debugging = true;
