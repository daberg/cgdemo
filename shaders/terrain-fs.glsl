#version 300 es

precision mediump float;

in vec3 v_world_pos;
in vec3 v_world_normal;
in vec3 v_color;

uniform vec3 light_dir;
uniform vec3 light_color;

out vec4 f_color;

void main() {
    vec3 normal = normalize(v_world_normal);
    vec3 lambert = v_color * light_color * dot(-light_dir, normal);
    f_color = vec4(clamp(lambert, 0.0, 1.0), 1.0);
}
