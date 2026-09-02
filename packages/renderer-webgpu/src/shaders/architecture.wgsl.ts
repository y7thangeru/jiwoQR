/**
 * Native WGSL Compute and Vertex Shaders for Model 1 (Architecture).
 * Computes GPU-accelerated 3D-to-2D morphing directly inside the vertex pipeline.
 */

export const ARCHITECTURE_WGSL = /* wgsl */ `
struct Uniforms {
  mvpMatrix: mat4x4<f32>,
  morphProgress: f32,
  time: f32,
  pad0: f32,
  pad1: f32,
};

struct ModuleInstance {
  pos3D: vec4<f32>,    // xyz: position3D, w: height3D
  pos2D: vec4<f32>,    // xyz: position2D, w: height2D
  scale3D: vec4<f32>,  // xyz: scale3D, w: rotationZ
  scale2D: vec4<f32>,  // xyz: scale2D, w: unused
  color3D: vec4<f32>,  // rgba 3D color
  color2D: vec4<f32>,  // rgba 2D canonical color
};

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var<storage, read> instances: array<ModuleInstance>;

struct VertexInput {
  @location(0) position: vec3<f32>,
  @location(1) normal: vec3<f32>,
};

struct VertexOutput {
  @builtin(position) clip_position: vec4<f32>,
  @location(0) frag_color: vec4<f32>,
  @location(1) frag_normal: vec3<f32>,
};

fn jiwoEase(t: f32) -> f32 {
  let c = clamp(t, 0.0, 1.0);
  if (c < 0.5) {
    return 4.0 * c * c * c;
  } else {
    return 1.0 - pow(-2.0 * c + 2.0, 3.0) * 0.5;
  }
}

@vertex
fn vs_main(
  in: VertexInput,
  @builtin(instance_index) instance_idx: u32
) -> VertexOutput {
  var out: VertexOutput;
  let inst = instances[instance_idx];

  let t = jiwoEase(uniforms.morphProgress);

  // Interpolate module scale and position
  let s = mix(inst.scale3D.xyz, inst.scale2D.xyz, t);
  let p = mix(inst.pos3D.xyz, inst.pos2D.xyz, t);

  // Scaled local coordinate
  let localPos = in.position * s;

  // Unfold / rotate around Z axis
  let rotZ = inst.scale3D.w * (1.0 - t);
  let cosR = cos(rotZ);
  let sinR = sin(rotZ);

  let rotatedPos = vec3<f32>(
    localPos.x * cosR - localPos.y * sinR,
    localPos.x * sinR + localPos.y * cosR,
    localPos.z
  );

  let worldPos = rotatedPos + p;

  // Transform to clip space
  out.clip_position = uniforms.mvpMatrix * vec4<f32>(worldPos, 1.0);

  // Normal rotation
  let rotatedNormal = vec3<f32>(
    in.normal.x * cosR - in.normal.y * sinR,
    in.normal.x * sinR + in.normal.y * cosR,
    in.normal.z
  );
  out.frag_normal = rotatedNormal;

  // Interpolate color from 3D palette to pure 2D black
  out.frag_color = mix(inst.color3D, inst.color2D, t);

  return out;
}

@fragment
fn fs_main(in: VertexOutput) -> @location(0) vec4<f32> {
  let lightDir = normalize(vec3<f32>(0.5, 0.7, 1.2));
  let norm = normalize(in.frag_normal);
  let diff = max(dot(norm, lightDir), 0.0);

  let ambient = 0.35;
  let lightIntensity = ambient + diff * 0.75;

  let litColor = in.frag_color.rgb * lightIntensity;
  return vec4<f32>(litColor, in.frag_color.a);
}
`;
