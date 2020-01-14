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
	vec3 refl = - reflect(light_dir, normal);
	return spec_col * light_col * pow(max(dot(refl, obs_dir), 0.0), shininess);
}

in vec3 v_world_pos;
in vec3 v_world_normal;
in vec2 v_uv;

uniform vec3 diff_color;
uniform vec3 spec_color;
uniform float shininess;

uniform vec3 light_dir;
uniform vec3 light_color;

uniform vec3 obs_w_pos;

uniform bool is_prop;
uniform sampler2D prop_tex;

out vec4 f_color;

void main() {
    vec3 ambient_light = vec3(0.5, 0.5, 0.5);

    vec3 main_color = diff_color;

    vec3 to_light = - normalize(light_dir);
    vec3 to_obs   =   normalize(obs_w_pos - v_world_pos);
    vec3 normal   =   normalize(v_world_normal);

    vec3 ambient = ambient_light * main_color;

    if (is_prop) {
        float alpha_min = 0.0;
        vec4 tex_col = texture(prop_tex, v_uv);

        f_color = vec4(
            ambient + lambert(to_light, light_color, normal, tex_col.xyz),
            tex_col.w * (1.0 - alpha_min) + alpha_min
        );
    }

    else {
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

        f_color = vec4(clamp(ambient + diffuse + specular, 0.0, 1.0), 1.0);
    }
}
