import { EntityDebugger } from './EntityDebugger';
import { Player } from './entities/Player';
import { Sphere } from './entities/Sphere';
import { TriMesh } from './entities/TriMesh';
import { Background } from './Background';
import { Sun } from './Sun';

class EntityManager {
  constructor(scene, world) {
    this.scene = scene;
    this.world = world;
    this.entities = [];
    this.debugger = new EntityDebugger(scene, world);
    this.debugger.disable();
  }

  runDemo() {
    // Add player
    var player = new Player({
      color: '#D57FFF',
      position: { x: 0, y: 6, z: 0 }
    });
    this.add(player);
    player.addEventListeners();

    // Set camera to player camera
    game.graphics.setCamera(player.camera);

    // Add meshes from dungeon model
    var dungeon = game.assets.models.cache['test'];
    var meshes = [];
    dungeon.traverse(function(child) {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        meshes.push(child);
      }
    });

    // Create TriMeshes from dungeon
    meshes.forEach(function(mesh) {
      var type = mesh.name.includes('-Dynamic') ? 'Dynamic' : 'Fixed';
      var triMesh = new TriMesh({ mesh: mesh, type: type });
      this.add(triMesh);
    }.bind(this));

    // Add random spheres
    for (var i = 0; i < 10; i++) {
      var x = (Math.random() * 12) - 6;
      var y = 12;
      var z = (Math.random() * 12) - 6;
      var radius = (Math.random() * 0.25) + 0.5;
      var rotation = Math.random() * Math.PI;
      var sphere = new Sphere({
        color: '#7fc9ff',
        position: { x: x, y: y, z: z },
        rotation: { x: rotation, y: rotation, z: rotation },
        radius: radius
      });
      this.add(sphere);
    }

    // Add background
    this.background = new Background({ radius: 50 });
    this.scene.add(this.background);

    // Add sun to scene
    this.sun = new Sun();
    this.sun.update(36);
    this.scene.add(this.sun);
  }

  updatePhysics(data) {
    // Update debugger buffer (optional if enabled)
    this.debugger.update();

    // Update all entities
    this.entities.forEach(function(child) {
        if (child.rigidBody) child.update(data.delta);
    });
  }

  updateGraphics(data) {
    // Update sun orbit angle
    this.sun.update(data.delta);

    // Lerp each body model position/rotation
    this.entities.forEach(function(child) {
      if (child.rigidBody) child.lerp(data.alpha);
    });
  }

  add(body) {
    this.entities.push(body);
    body.addToWorld(this.world);
    body.addToScene(this.scene);
  }

  remove(body) {
    var index = this.entities.indexOf(body);
    this.entities.splice(index, 1);
    body.removeFromWorld(this.world);
    body.removeFromScene(this.scene);
  }
}

export { EntityManager };