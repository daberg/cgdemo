#version 300 es

precision highp float;

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

in vec2 v_uv;

uniform vec3 light_dir;
uniform vec3 light_color;

uniform vec3 obs_w_pos;

uniform sampler2D sampler;

out vec4 f_color;

void main() {
    vec3 to_light = - normalize(light_dir);
    vec3 to_obs = normalize(obs_w_pos);
    vec3 normal = normalize(v_world_normal);

    vec3 diff_color = vec3(0.5, 0.5, 0.5);

    vec3 spec_color = vec3(0.2, 0.2, 0.2);
    float shininess = 1.0;

    vec3 ambient_color = vec3(0.3, 0.3, 0.3);

    float tex_mix = 0.5;
    vec3 tex_col = texture(sampler, v_uv).xyz;

    vec3 ambient = ambient_color * (1.0 - tex_mix) + tex_col * tex_mix;

    vec3 diffuse = lambert(
        to_light,
        light_color,
        normal,
        diff_color * (1.0 - tex_mix) + tex_col * tex_mix
    );

    vec3 specular = phong(
        to_light,
        light_color,
        normal,
        to_obs,
        spec_color,
        shininess
    );

    f_color = vec4(clamp(ambient + diffuse + specular, 0.0, 1.0), 1.0);

    //f_color = vec4((normal + 1.0) / 2.0, 1.0);
}
