#version 300 es

in vec3 v_position;
in vec3 v_color;

uniform mat4 wvp_matrix;

out vec3 f_color;

void main() {
    f_color = v_color;
    gl_Position = wvp_matrix * vec4(v_position, 1.0);
}
