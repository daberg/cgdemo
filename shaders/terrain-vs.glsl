#version 300 es

precision highp float;

in vec3 v_model_pos;
in vec3 v_model_normal;
in vec3 v_model_tangent;
in vec3 v_model_binormal;

uniform mat4 v_w_matrix;
uniform mat4 v_wvp_matrix;
uniform mat4 n_w_matrix;

out vec3 v_world_pos;
out vec3 v_world_normal;
out vec3 v_world_tangent;
out vec3 v_world_binormal;

out vec2 v_uv;

void main() {
    // Calculate world coordinates
    v_world_pos = (v_w_matrix * vec4(v_model_pos, 1.0)).xyz;

    // Calculate projection coordinates
    gl_Position = v_wvp_matrix * vec4(v_model_pos, 1.0);

    // Transform normal into world coordinates
    v_world_normal   = mat3(n_w_matrix) * v_model_normal;
    v_world_tangent  = mat3(n_w_matrix) * v_model_tangent;
    v_world_binormal = mat3(n_w_matrix) * v_model_binormal;

    // Calculate uv mapping
    v_uv = v_world_pos.xz / 70.0;
}
