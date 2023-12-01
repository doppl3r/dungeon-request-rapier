import { BoxGeometry, Mesh, MeshStandardMaterial } from 'three';
import { Cuboid as CuboidShape } from '@dimforge/rapier3d';
import { Entity } from './Entity.js';

class Cuboid extends Entity {
  constructor(options) {
    // Assign body shape
    if (options.size == null) options.size = { x: 1, y: 1, z: 1 };
    options = Object.assign({
      color: '#ffffff',
      shape: new CuboidShape(options.size.x / 2, options.size.y / 2, options.size.z / 2)
    }, options);

    // Inherit Entity class
    super(options);

    // Initialize default cube mesh
    var geometry = new BoxGeometry(options.size.x, options.size.y, options.size.z);
    var material = new MeshStandardMaterial({ color: options.color });
    var mesh = new Mesh(geometry, material);
    mesh.receiveShadow = true;
    mesh.castShadow = true;
    this.object.add(mesh);
  }
}

export { Cuboid };