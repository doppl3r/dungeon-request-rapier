import { Graphics } from './Graphics';
import { Entities } from './entities/Entities.js';
import { Connector } from './Connector.js';
import { Physics } from './Physics';
import { Player } from './entities/Player';

class Client {
  constructor(canvas) {
    this.entities = new Entities();
    this.graphics = new Graphics(canvas);
    this.physics = new Physics();
    this.physics.setTick(30);
    this.player = new Player({ position: { x: 0, y: 1, z: 0 } });
    this.connector = new Connector();
  }

  load(assets) {
    // Initialize player entity
    this.player.addModel(assets.models.duplicate('player'));
    this.player.model.play('Idle', 0); // Start idle animation
    this.player.addEventListeners();

    // Set camera to player camera
    this.graphics.setCamera(this.player.camera);
    this.graphics.setSelectedObjects([this.player.model]);
  }

  updateBodies(delta) {
    this.entities.updateBodies(delta)
    this.physics.step();
  }

  updateObjects(delta, alpha) {
    this.entities.updateObjects(delta, alpha);
    this.graphics.update(delta); // Update 3D engine
  }
}

export { Client };