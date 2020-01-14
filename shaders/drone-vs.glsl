#version 300 es

precision highp float;

in vec3 v_model_pos;
in vec3 v_model_normal;

uniform mat4 v_w_matrix;
uniform mat4 v_wvp_matrix;
uniform mat4 n_w_matrix;

out vec3 v_world_pos;
out vec3 v_world_normal;
out vec2 v_uv;

void main() {
    // Calculate world coordinates
    v_world_pos = (v_w_matrix * vec4(v_model_pos, 1.0)).xyz;

    // Calculate projection coordinates
    gl_Position = v_wvp_matrix * vec4(v_model_pos, 1.0);

    // Transform normal into world coordinates
    v_world_normal = mat3(n_w_matrix) * v_model_normal;

    // Obtain coordinates for prop texture mapping
    // Prop size is ~ 40 * 40 centered in (0,0,0)
    float len = 80.0;
    float factor = 1.0;

    vec2 normalized_pos = (v_model_pos.xz + len / 2.0) / len;
    v_uv = normalized_pos * factor + (1.0 - factor) / 2.0;
}
