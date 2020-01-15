% Drone WebGL Demo
% Davide Bergamaschi
% 2020

# Project specification

\large

* Drone that flies around in a 3D landscape

\vspace{15pt}

* Third-person point of view

\vspace{15pt}

* Drone cannot fly underneath the terrain

\vspace{15pt}

* Shading computation done in World-Space coordinates

# Implementation features

\large

* Scan-line rendering + Phong shading (World Space)

  * Main direct light source + ambient component

  * Lambert diffuse + Phong specular BRDF

\vspace{15pt}

* Third-person "Look-At" view, with camera following drone

\vspace{15pt}

* User interaction through basic flight control

# Implementation features

\large

* Custom artist-made drone model and terrain textures

\vspace{15pt}

* Procedural morphology generated on the fly

  * Planar grid of vertices "disturbed" with 2D simplex GPU noise

  * Vertical displacement computed _una tantum_ with vertex shader

  * Normals and tangents obtained from analytical derivatives

  * All data is saved to GPU buffers through Transform Feedback

\vspace{15pt}

* Terrain bump mapping using texture data

# Implementation features

\large

* Invisible walls

  * Prevent intersection with terrain

  * Delimit simulation area

\vspace{15pt}

* Independently animated propellers

  * Motion blur effect baked in static texture

  * Rotation at constant speed

\vspace{15pt}

* Exponential distance fog
