import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { Background } from './Background';
import { Cuboid } from './Cuboid';
import { Player } from './Player';
import { Sphere } from './Sphere';
import { TriMesh } from './TriMesh';

/*
  This class creates new entity instances
*/

class EntityFactory {
  constructor() {

  }

  createBackground(options) {
    return new Background(options);
  }

  createCuboid(options) {
    return new Cuboid(options);
  }

  createPlayer(options) {
    return new Player(options);
  }

  createSphere(options) {
    return new Sphere(options);
  }

  createTriMesh(options) {
    return new TriMesh(options);
  }

  createTriMeshFromModel(model) {
    // Merge geometries from all meshes
    var geometry;
    var geometries = [];
    model.traverse(function(child) {
      if (child.isMesh) {
        geometry = child.geometry.clone();
        geometry.rotateX(child.rotation.x);
        geometry.rotateY(child.rotation.y);
        geometry.rotateZ(child.rotation.z);
        geometry.scale(child.scale.x, child.scale.y, child.scale.z);
        geometry.translate(child.position.x, child.position.y, child.position.z);
        geometries.push(geometry);
      }
    });
    geometry = mergeGeometries(geometries);

    // Create TriMesh from merged geometry
    var vertices = geometry.attributes.position.array;
    var indices = geometry.index.array;
    return this.createTriMesh({ indices: indices, model: model, name: model.name, vertices: vertices })
  }

  createTriMeshesFromModel(model) {
    var meshes = [];
    var triMeshes = [];

    // Traverse model tree for mesh types
    model.traverse(function(child) {
      if (child.isMesh) {
        meshes.push(child);
      }
    });

    // Loop through meshes and create TriMesh entities
    for (var i = 0; i < meshes.length; i++) {
      var mesh = meshes[i];
      var geometry = mesh.geometry;
      var vertices = geometry.attributes.position.array;
      var indices = geometry.index.array;

      // Translate geometry from mesh data and set mesh data to world origin
      geometry.translate(mesh.position.x, mesh.position.y, mesh.position.z);
      geometry.rotateX(mesh.rotation.x);
      geometry.rotateY(mesh.rotation.y);
      geometry.rotateZ(mesh.rotation.z);
      mesh.position.set(0, 0, 0);
      mesh.rotation.set(0, 0, 0);

      // Add TriMesh to list
      var triMesh = this.createTriMesh({ indices: indices, model: mesh, vertices: vertices });
      triMeshes.push(triMesh);
    }

    // Return an array of TriMeshes
    return triMeshes;
  }
}

export { EntityFactory }