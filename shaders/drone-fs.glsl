#version 300 es

precision mediump float;

in vec3 f_color;

out vec4 out_color;

void main() {
    out_color = vec4(f_color,1.0);
}
