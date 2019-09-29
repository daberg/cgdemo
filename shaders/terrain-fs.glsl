#version 300 es

precision mediump float;

in vec3 v_world_pos;
in vec3 v_world_normal;
in vec3 v_color;

uniform vec3 light_dir;
uniform vec3 light_color;

uniform vec3 obs_w_pos;

out vec4 f_color;

void main() {
    vec3  phong_color = vec3(1.0, 1.0, 1.0);
    float phong_power = 10.0;

    vec3 to_light = - normalize(light_dir);
    vec3 to_obs = normalize(obs_w_pos);
    vec3 normal = normalize(v_world_normal);

    vec3 lambert = v_color * light_color * clamp(dot(to_light, normal), 0.0, 1.0);

    vec3 phong_refl = 2.0 * dot(to_light, normal) * normal - to_light;
    vec3 phong = phong_color * light_color * pow(clamp(dot(to_obs, phong_refl), 0.0, 1.0), phong_power);

    f_color = vec4(min(lambert + phong, vec3(1.0, 1.0, 1.0)), 1.0); 
}
