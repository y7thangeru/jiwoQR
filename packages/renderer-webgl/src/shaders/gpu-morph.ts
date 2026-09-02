import * as THREE from 'three';

export interface GPUMorphInstanceData {
  count: number;
  positions3D: Float32Array;
  positions2D: Float32Array;
  scales3D: Float32Array;
  scales2D: Float32Array;
  rotationsZ3D?: Float32Array;
  colors3D: Float32Array;
  colors2D?: Float32Array;
}

export interface GPUMorphUniforms {
  uMorphProgress: { value: number };
}

/**
 * Injects custom GPU vertex & fragment shader logic into a Three.js material
 * to calculate real-time 3D-to-2D morphing directly on the GPU.
 */
export function attachGPUMorphShader<T extends THREE.Material>(
  material: T,
  initialProgress = 0
): GPUMorphUniforms {
  const uniforms: GPUMorphUniforms = {
    uMorphProgress: { value: initialProgress },
  };

  material.userData.uMorphProgress = uniforms.uMorphProgress;

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uMorphProgress = uniforms.uMorphProgress;

    // 1. Vertex Shader Injections
    shader.vertexShader = `
      attribute vec3 aPosition3D;
      attribute vec3 aPosition2D;
      attribute vec3 aScale3D;
      attribute vec3 aScale2D;
      attribute float aRotationZ3D;
      attribute vec3 aColor3D;
      attribute vec3 aColor2D;

      uniform float uMorphProgress;
      varying vec3 vGPUMorphColor;

      float jiwoCubicEase(float t) {
        return t < 0.5 ? 4.0 * t * t * t : 1.0 - pow(-2.0 * t + 2.0, 3.0) * 0.5;
      }
      \n` + shader.vertexShader;

    // Declare morphing variables at the top of void main()
    shader.vertexShader = shader.vertexShader.replace(
      'void main() {',
      `
      void main() {
        float tMorph = clamp(uMorphProgress, 0.0, 1.0);
        float easedT = jiwoCubicEase(tMorph);
        float curRotZ = aRotationZ3D * (1.0 - easedT);
      `
    );

    // Replace <defaultnormal_vertex> to adjust normal for rotation
    shader.vertexShader = shader.vertexShader.replace(
      '#include <defaultnormal_vertex>',
      `
      vec3 transformedNormal = objectNormal;
      if (abs(curRotZ) > 0.0001) {
        float cRN = cos(curRotZ);
        float sRN = sin(curRotZ);
        transformedNormal.xy = mat2(cRN, -sRN, sRN, cRN) * transformedNormal.xy;
      }
      #ifdef USE_TANGENT
        vec3 transformedTangent = objectTangent;
      #endif
      `
    );

    // Replace <begin_vertex> to calculate interpolated position, scale & translation
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
      vec3 curScale = mix(aScale3D, aScale2D, easedT);
      vec3 curPos = mix(aPosition3D, aPosition2D, easedT);

      // Apply scale
      vec3 transformed = position * curScale;

      // Apply Z-rotation if any
      if (abs(curRotZ) > 0.0001) {
        float cR = cos(curRotZ);
        float sR = sin(curRotZ);
        transformed.xy = mat2(cR, -sR, sR, cR) * transformed.xy;
      }

      // Apply translation
      transformed += curPos;

      // Interpolate color to scan mode (pitch black or custom aColor2D)
      vGPUMorphColor = mix(aColor3D, aColor2D, easedT);
      `
    );

    // Bypass instanceMatrix in project_vertex to guarantee 100% GPU morphing stability
    shader.vertexShader = shader.vertexShader.replace(
      '#include <project_vertex>',
      `
      vec4 mvPosition = vec4( transformed, 1.0 );
      mvPosition = modelViewMatrix * mvPosition;
      gl_Position = projectionMatrix * mvPosition;
      `
    );

    // 2. Fragment Shader Injections
    shader.fragmentShader = `
      varying vec3 vGPUMorphColor;
      \n` + shader.fragmentShader;

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <color_fragment>',
      `
      #include <color_fragment>
      diffuseColor.rgb = vGPUMorphColor;
      `
    );
  };

  // Ensure unique program cache key per material type
  material.customProgramCacheKey = () => `${material.type}_JiwoGPUMorphShader_v5`;

  return uniforms;
}

/**
 * Attaches InstancedBufferAttributes for GPU-accelerated morphing to geometry and initializes instanced mesh.
 */
export function setupGPUMorphAttributes(
  geometry: THREE.BufferGeometry,
  data: GPUMorphInstanceData,
  mesh?: THREE.InstancedMesh
): void {
  const { count, positions3D, positions2D, scales3D, scales2D, rotationsZ3D, colors3D, colors2D } = data;

  const finalColors2D = colors2D ?? new Float32Array(count * 3); // Defaults to (0,0,0) pure black
  const finalRotations = rotationsZ3D ?? new Float32Array(count);

  geometry.setAttribute('aPosition3D', new THREE.InstancedBufferAttribute(positions3D, 3));
  geometry.setAttribute('aPosition2D', new THREE.InstancedBufferAttribute(positions2D, 3));
  geometry.setAttribute('aScale3D', new THREE.InstancedBufferAttribute(scales3D, 3));
  geometry.setAttribute('aScale2D', new THREE.InstancedBufferAttribute(scales2D, 3));
  geometry.setAttribute('aRotationZ3D', new THREE.InstancedBufferAttribute(finalRotations, 1));
  geometry.setAttribute('aColor3D', new THREE.InstancedBufferAttribute(colors3D, 3));
  geometry.setAttribute('aColor2D', new THREE.InstancedBufferAttribute(finalColors2D, 3));

  if (mesh) {
    mesh.frustumCulled = false;
    const dummy = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }
}
