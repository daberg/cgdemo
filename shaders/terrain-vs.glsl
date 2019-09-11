#version 300 es

in vec3 v_position;

uniform mat4 wvp_matrix;

out vec3 v_color;

void main() {
    gl_Position = wvp_matrix * vec4(v_position, 1.0);

    // SE purple
    if (v_position.x < 0.0 && v_position.z < 0.0)
        v_color = vec3(1.0, 0.0, 1.0);
    // NE red
    else if (v_position.x < 0.0 && v_position.z > 0.0)
        v_color = vec3(1.0, 0.0, 0.0);
    // SW green
    else if (v_position.x > 0.0 && v_position.z < 0.0)
        v_color = vec3(0.0, 1.0, 0.0);
    // NW blue
    else if (v_position.x > 0.0 && v_position.z > 0.0)
        v_color = vec3(0.0, 0.0, 1.0);
    else
        v_color = vec3(0.5, 0.5, 0.5);
}
