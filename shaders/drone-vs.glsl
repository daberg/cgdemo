#version 300 es

in vec3 v_model_pos;
in vec3 v_model_normal;

uniform mat4 v_wvp_matrix;
uniform mat4 n_w_matrix;

out vec3 v_world_normal;

void main() {
    gl_Position = v_wvp_matrix * vec4(v_model_pos, 1.0);
    v_world_normal = mat3(n_w_matrix) * v_model_normal;
}
