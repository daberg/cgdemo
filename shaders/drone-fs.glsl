#version 300 es

precision mediump float;

vec3 lambert(
    vec3 light_dir,
    vec3 light_col,
    vec3 normal,
    vec3 diff_col
) {
    return diff_col * light_col * clamp(dot(light_dir, normal), 0.0, 1.0);
}

vec3 phong(
    vec3 light_dir,
    vec3 light_col,
    vec3 normal,
    vec3 obs_dir,
    vec3 spec_col,
    float shininess
) {
	vec3 refl = -reflect(light_dir, normal);
	return spec_col * light_col * pow(max(dot(refl, obs_dir), 0.0), shininess);
}

in vec3 v_world_pos;
in vec3 v_world_normal;

uniform vec3 diff_color;
uniform vec3 spec_color;
uniform float shininess;

uniform vec3 light_dir;
uniform vec3 light_color;

uniform vec3 obs_w_pos;

out vec4 out_color;

void main() {
    vec3 to_light = - normalize(light_dir);
    vec3 to_obs = normalize(obs_w_pos);
    vec3 normal = normalize(v_world_normal);

    vec3 diffuse = lambert(
        to_light,
        light_color,
        normal,
        diff_color
    );

    vec3 specular = phong(
        to_light,
        light_color,
        normal,
        to_obs,
        spec_color,
        shininess
    );

    out_color = vec4(clamp(diffuse + specular, 0.0, 1.0), 1.0);
}
