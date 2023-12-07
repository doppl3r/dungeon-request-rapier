import { Assets } from './Assets.js';
import { Loop } from './Loop';
import { Graphics } from './Graphics';
import { Physics } from './Physics';
import { EntityManager } from './EntityManager.js';
import { Network } from './Network.js';
import Stats from './Stats.js';

class Game {
  constructor() {
    this.assets = new Assets();
    this.loop = new Loop();
    this.stats = new Stats();
    document.body.appendChild(this.stats.dom);
  }

  init(canvas) {
    this.graphics = new Graphics(canvas);
    this.graphics.setTick(-1);
    this.physics = new Physics();
    this.physics.setTick(30);
    this.entityManager = new EntityManager(this.graphics.scene, this.physics.world);
    this.network = new Network('speed-looters');
    this.network.setTick(10);

    // Load game after assets have loaded
    this.assets.load(function() {
      this.load();
    }.bind(this));
  }

  load() {
    // Start demo world
    this.entityManager.runDemo();
    this.network.host();

    // Add physics loop
    this.loop.add(this.physics.tick, function(data) {
      this.entityManager.updatePhysics(data); // Modify entity bodies before world.step()
      this.physics.update(data); // Update all physics world bodies
    }.bind(this));

    // Add graphic loop
    this.loop.add(this.graphics.tick, function(data) {
      this.stats.begin(); // Start FPS counter
      this.entityManager.updateGraphics(data); // Update entity 3D objects from entities
      this.graphics.update(data); // Update 3D engine
      this.stats.end(); // Complete FPS counter
    }.bind(this));

    // Add network loop
    this.loop.add(this.network.tick, function(data) {
      this.network.update(data);
    }.bind(this));

    // Start loop
    this.loop.start();
  }
}

export { Game };