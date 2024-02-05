import { Graphics } from './Graphics';
import { EntityManager } from './entities/EntityManager.js';
import { EntityFactory } from './entities/EntityFactory.js';
import { Connector } from './Connector.js';
import { Physics } from './Physics';

class Client {
  constructor(canvas) {
    this.graphics = new Graphics(canvas);
    this.physics = new Physics();
    this.entityManager = new EntityManager(this.graphics.scene, this.physics.world);
    this.entityFactory = new EntityFactory();
    this.physics.setTick(30);
    this.connector = new Connector();
    this.player;
  }

  load(assets) {
    // Assign assets for later
    this.assets = assets;

    // Initialize player entity
    this.player = this.entityFactory.createPlayer({
      position: { x: 0, y: 2.5, z: 0 },
      model: assets.models.duplicate('player')
    });
    this.player.model.play('Idle', 0); // Start idle animation
    this.player.addEventListeners();

    // Set camera to player camera
    this.graphics.setCamera(this.player.camera);
    this.graphics.setSelectedObjects([this.player.model]);

    // Add connection data event listener
    this.connector.on('connection_data', function(e) {
      if (e.data.type == 'server_request_player_data') {
        // Send the server the client player data
        this.sendPlayerDataToServer();
      }
      else {
        // Update client entities from the server
        this.updateEntitiesFromServer(e.data.entities);
      }
    }.bind(this));
  }

  updateBodies(delta) {
    this.entityManager.updateBodies(delta)
    this.physics.step();
  }

  updateObjects(delta, alpha) {
    this.entityManager.updateObjects(delta, alpha);
    this.graphics.update(delta); // Update 3D engine
  }

  updateEntitiesFromServer(entitiesJSON) {
    entitiesJSON.forEach(function(entityJSON) {
      // Add entity if it does not exist on client
      if (this.entityManager.get(entityJSON.uuid) == null) {
        // Duplicate model if it exists
        if (entityJSON.model) {
          var model = this.assets.models.duplicate(entityJSON.model.name);
          entityJSON.model = model;
        }
        
        // Create new entity or assign to the client player
        var entity;
        if (entityJSON.uuid == this.player.uuid) entity = this.player;
        else entity = this.entityFactory.create(entityJSON);

        // Add entity to the current entity map
        this.entityManager.add(entity);
      }
      else {
        // Get client entity by uuid
        var entity = this.entityManager.get(entityJSON.uuid);

        // Update non-player entities
        if (entity.uuid != this.player.uuid) {
          // TODO: Update client entities from server entity info (ex: position)
         
        }
        else {
          // TODO: Send client player data back to the server (ex: position)
        }
      }
    }.bind(this));
  }

  sendPlayerDataToServer() {
    this.connector.connections[0].send({
      type: 'client_send_player_data',
      entity: this.player.toJSON()
    });
  }
}

export { Client };