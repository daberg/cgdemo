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

vec3 hemispheric(
    vec3 up,
    vec3 bottom_col,
    vec3 top_col,
    vec3 normal,
    vec3 amb_col
) {
	float blend = (dot(normal, up) + 1.0) / 2.0;
	return (top_col * blend + bottom_col * (1.0 - blend)) * amb_col;
}

in vec3 v_world_pos;
in vec3 v_world_normal;
in vec2 v_uv;

uniform vec3 diff_color;
uniform vec3 spec_color;
uniform float shininess;

uniform vec3 light_dir;
uniform vec3 light_color;

uniform vec3 ambient_lower_color;
uniform vec3 ambient_upper_color;

uniform vec3 obs_w_pos;

uniform bool is_prop;
uniform sampler2D prop_tex;

out vec4 f_color;

void main() {
    vec3 main_color = diff_color;

    vec3 to_light = - normalize(light_dir);
    vec3 to_obs   =   normalize(obs_w_pos - v_world_pos);
    vec3 normal   =   normalize(v_world_normal);

    vec3 ambient = hemispheric(
        vec3(0.0, 1.0, 0.0),
        ambient_lower_color,
        ambient_upper_color,
        normal,
        main_color
    );

    if (is_prop) {
        vec4 tex_col = texture(prop_tex, v_uv);

        vec3 diffuse = lambert(to_light, light_color, normal, tex_col.xyz);

        f_color = vec4(
            clamp(ambient + diffuse, 0.0, 1.0),
            tex_col.w
        );
    }

    else {
        vec3 diffuse = lambert(
            to_light,
            light_color,
            normal,
            main_color
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
