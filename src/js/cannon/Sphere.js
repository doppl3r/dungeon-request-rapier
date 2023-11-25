import { SphereGeometry, Mesh, MeshNormalMaterial } from 'three';
import { Sphere as SphereES } from 'cannon-es';
import { Body } from './Body.js';

class Sphere extends Body {
  constructor(options) {
    // Assign body shape
    options = Object.assign({
      color: '#ffffff',
      type: 1, // 1 = DYNAMIC, 4 = KINEMATIC, 2 = STATIC
      radius: 1,
      widthSegments: 32,
      heightSegments: 16,
      shape: new SphereES(options.radius)
    }, options);

    // Inherit Body class
    super(options);

    // Initialize default cube mesh
    var geometry = new SphereGeometry(options.radius, options.widthSegments, options.heightSegments);
    var material = new MeshNormalMaterial({ color: options.color });
    var mesh = new Mesh(geometry, material);
    mesh.receiveShadow = true;
    mesh.castShadow = true;
    this.object.add(mesh);
  }
}

export { Sphere };