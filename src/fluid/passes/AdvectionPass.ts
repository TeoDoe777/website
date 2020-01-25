import {
  BufferAttribute,
  BufferGeometry,
  Mesh,
  RawShaderMaterial,
  Scene,
  Texture,
  Uniform
} from "three";

export class AdvectionPass {
  public readonly scene: Scene;

  private material: RawShaderMaterial;
  private mesh: Mesh;

  constructor(
    readonly initialVelocity: Texture,
    readonly initialValue: Texture,
    readonly floatSim: boolean
  ) {
    this.scene = new Scene();

    const geometry = new BufferGeometry();
    geometry.setAttribute(
      "position",
      new BufferAttribute(
        new Float32Array([-1, -1, 1, -1, 1, 1, 1, 1, -1, 1, -1, -1]),
        2
      )
    );
    this.material = new RawShaderMaterial({
      uniforms: {
        timeDelta: new Uniform(0.0),
        inputTexture: new Uniform(initialValue),
        velocity: new Uniform(initialVelocity)
      },
      defines: !floatSim ? { UINT_TARGET: true } : {},
      vertexShader: `
        attribute vec2 position;
        varying vec2 vUV;

        void main() {
          vUV = position * 0.5 + 0.5;
          gl_Position = vec4(position, 0.0, 1.0);
        }`,
      fragmentShader: `
        precision highp float;
        precision highp int;
        varying vec2 vUV;
        uniform float timeDelta;
        uniform sampler2D inputTexture;
        uniform sampler2D velocity;

        void main() {
          #ifdef UINT_TARGET
          vec2 prevUV = fract(vUV - timeDelta * (texture2D(velocity, vUV).xy * 2.0 - 1.0));
          #else
          vec2 prevUV = fract(vUV - timeDelta * texture2D(velocity, vUV).xy);
          #endif
          gl_FragColor = texture2D(inputTexture, prevUV);
        }`,
      depthTest: false,
      depthWrite: false
    });
    this.mesh = new Mesh(geometry, this.material);
    this.mesh.frustumCulled = false; // Just here to silence a console error.

    this.scene.add(this.mesh);
  }

  public update(uniforms: any): void {
    if (uniforms.timeDelta) {
      this.material.uniforms.timeDelta.value = uniforms.timeDelta;
    }
    if (uniforms.inputTexture) {
      this.material.uniforms.inputTexture.value = uniforms.inputTexture;
    }
    if (uniforms.velocity) {
      this.material.uniforms.velocity.value = uniforms.velocity;
    }
  }
}
