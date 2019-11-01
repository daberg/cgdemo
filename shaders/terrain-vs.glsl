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
    // Transform into world coordinates
    v_world_pos = (v_w_matrix * vec4(v_model_pos, 1.0)).xyz;

    // Transform it into projection coordinates
    gl_Position = v_wvp_matrix * vec4(v_model_pos, 1.0);

    // Transform normal into world coordinates
    v_world_normal = mat3(n_w_matrix) * v_model_normal;

    // Calculate uv mapping
    v_uv = v_world_pos.xz / 80.0;
}
