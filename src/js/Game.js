import { Assets } from './Assets.js';
import { Loop } from './Loop';
import { Graphics } from './Graphics';
import { Physics } from './Physics';
import { Entities } from './Entities.js';
import { Debugger } from './Debugger.js';
import { Server } from './Server.js';
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
    this.graphics.setShadows(false);
    this.physics = new Physics();
    this.physics.setTick(30);
    this.entities = new Entities(this.graphics.scene, this.physics.world);
    this.debugger = new Debugger(this.graphics.scene, this.physics.world);
    this.debugger.disable();
    this.server = new Server(this.graphics.scene, this.physics.world);
    this.server.setTick(10);

    // Load game after assets have loaded
    this.assets.load(function() {
      this.load();
    }.bind(this));
  }

  load() {
    // Start demo world
    this.entities.runDemo();
    this.server.host();

    // Add physics loop
    this.loop.add(this.physics.tick, function(data) {
      this.entities.updateBodies(data.delta); // Modify entity bodies before world.step()
      this.physics.step(); // Perform world calculation
      this.debugger.update(); // Update debugger buffer
    }.bind(this));

    // Add graphic loop
    this.loop.add(this.graphics.tick, function(data) {
      this.stats.begin(); // Start FPS counter
      this.entities.updateObjects(data.delta, data.alpha); // Update entity 3D objects from entities
      this.graphics.update(data.delta); // Update 3D engine
      this.stats.end(); // Complete FPS counter
    }.bind(this));

    // Add server loop
    this.loop.add(this.server.tick, function(data) {
      this.server.update(data.delta);
    }.bind(this));

    // Start loop
    this.loop.start();
  }
}

export { Game };