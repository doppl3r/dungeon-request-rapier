import { Euler, MathUtils, Object3D, Quaternion, Vector3 } from 'three';
import { ColliderDesc, RigidBodyDesc, RigidBodyType } from '@dimforge/rapier3d';

/*
  An entity is an abstract class that contains a single 3D object and a
  single rigid body object. An entity assumes that the rigid body is being
  updated at a lower interval, and leverages the lerp() function to
  interpolate the 3D object at a higher interval (smoother results)
*/

class Entity {
  constructor(options) {
    // Set options with default values
    options = Object.assign({
      uuid: MathUtils.generateUUID(),
      position: { x: 0, y: 0, z: 0 },
      quaternion: { x: 0, y: 0, z: 0, w: 1 },
      scale: { x: 1, y: 1, z: 1 },
      type: 'Dynamic', // 0: Dynamic, 1: Fixed, 2: KinematicPositionBased, 3: KinematicVelocityBased
      isEnabled: true,
      isSensor: false,
      shape: null,
      model: null
    }, options);

    // Apply defaults
    this.uuid = options.uuid;

    // Initialize rigid body description
    this.rigidBodyDesc = new RigidBodyDesc(RigidBodyType[options.type]);
    this.rigidBodyDesc.setTranslation(options.position.x, options.position.y, options.position.z);
    this.rigidBodyDesc.setRotation(options.quaternion);
    this.rigidBodyDesc.setEnabled(options.isEnabled);
    
    // Initialize collider description
    this.colliderDesc = new ColliderDesc(options.shape);
    this.colliderDesc.setSensor(options.isSensor);

    // These properties are created when added to scene/world
    this.scene;
    this.world;
    this.body;
    this.collider;

    // Create an empty object
    this.object = new Object3D();

    // Add optional model
    this.addModel(options.model);

    // Initialize default snapshot for object position/rotation (s)lerp
    this.snapshot = {
      position_1: new Vector3().copy(this.rigidBodyDesc.translation), // Previous position
      position_2: new Vector3().copy(this.rigidBodyDesc.translation), // Current position
      quaternion_1: new Quaternion().copy(this.rigidBodyDesc.rotation), // Previous rotation
      quaternion_2: new Quaternion().copy(this.rigidBodyDesc.rotation), // Current rotation
      scale_1: new Vector3().copy(options.scale), // Previous scale
      scale_2: new Vector3().copy(options.scale) // Current scale
    }

    // Set initial object position/rotation from snapshot
    this.lerp(1);
  }

  updateBody(delta) {
    // Take a snapshot every time the entity is updated
    if (this.body) this.takeSnapshot();
  }

  updateObject(delta, alpha) {
    // Update model (optional)
    if (this.model && this.model.mixer) {
      this.model.mixer.update(delta);
    }

    // Interpolate 3D object position
    this.lerp(alpha);
  }

  addToWorld(world) {
    // Check if collider description shape exists
    if (this.colliderDesc.shape) {
      // Create rigid body in the world
      this.world = world;
      this.body = world.createRigidBody(this.rigidBodyDesc);
      this.collider = world.createCollider(this.colliderDesc, this.body); // Parent collision to rigid body
  
      // Update default 3D object position and rotation
      this.object.position.copy(this.body.translation());
      this.object.quaternion.copy(this.body.rotation());
  
      // Take snapshot from rigid body
      this.takeSnapshot();
    }
  }

  removeFromWorld(world) {
    if (this.body) {
      world.removeRigidBody(this.body); // Includes colliders that were attached
      this.world = null;
    }
  }

  addToScene(scene) {
    this.scene = scene;
    scene.add(this.object);
  }

  removeFromScene(scene) {
    scene.remove(this.object);
    this.scene = null;
  }

  setPosition(position) {
    if (this.body) this.body.setTranslation(position);
  }

  setNextPosition(position) {
    if (this.body) this.body.setNextKinematicTranslation(position);
  }

  setRotation(quaternion) {
    if (this.body) this.body.setRotation(quaternion);
  }

  setNextRotation(quaternion) {
    if (this.body) this.body.setNextKinematicRotation(quaternion);
  }

  setScale(scale) {
    this.snapshot.scale_1.copy(scale);
  }

  setNextScale(scale) {
    this.snapshot.scale_2.copy(scale);
  }

  addModel(model) {
    if (model) {
      this.object.add(model);
      this.model = model;
      
      // Offset model position from shape halfHeight value
      if (this.colliderDesc.shape && this.colliderDesc.shape.halfHeight) {
        if (this.model.position) {
          this.model.position.y = -(this.colliderDesc.shape.halfHeight * 2);
        }
      }
    }
  }

  takeSnapshot() {
    // A snapshot requires a physical rigid body
    if (this.body) {
      // Store previous snapshot position for lerp
      this.snapshot.position_1.copy(this.snapshot.position_2);
      this.snapshot.quaternion_1.copy(this.snapshot.quaternion_2);

      // Store next position for lerp if the rigid body is a kinematic type
      if (this.body.isKinematic()) {
        this.snapshot.position_2.copy(this.body.nextTranslation());
        this.snapshot.quaternion_2.copy(this.body.nextRotation());
      }
      else {
        // Store next position for lerp for all other rigid body types
        this.snapshot.position_2.copy(this.body.translation());
        this.snapshot.quaternion_2.copy(this.body.rotation());
      }
    }
  }

  lerp(alpha = 0) {
    // Skip (s)lerp if body type is null or "Fixed"
    if (this.body && this.body.isFixed()) return false;

    // Linear interpolation using alpha value
    this.object.scale.lerpVectors(this.snapshot.scale_1, this.snapshot.scale_2, alpha);
    this.object.position.lerpVectors(this.snapshot.position_1, this.snapshot.position_2, alpha);
    this.object.quaternion.slerpQuaternions(this.snapshot.quaternion_1, this.snapshot.quaternion_2, alpha);
  }

  toJSON() {
    var json = {
      uuid: this.uuid,
      class: this.constructor.name,
      position: {
        x: this.snapshot.position_2.x,
        y: this.snapshot.position_2.y,
        z: this.snapshot.position_2.z
      },
      quaternion: {
        x: this.snapshot.quaternion_2.x,
        y: this.snapshot.quaternion_2.y,
        z: this.snapshot.quaternion_2.z,
        w: this.snapshot.quaternion_2.w,
      },
      scale: {
        x: this.snapshot.scale_2.x,
        y: this.snapshot.scale_2.y,
        z: this.snapshot.scale_2.z,
      }
    };

    // Add body info
    if (this.body) {
      json.body = {
        type: this.body.bodyType()
      }
    }

    // Add model info
    if (this.model) {
      json.model = {
        name: this.model.name
      }

      // Add optional actions
      if (this.model.actions && this.model.actions.active) {
        json.model.action = {
          duration: this.model.actions.active.duration,
          name: this.model.actions.active.getClip().name,
          time: this.model.actions.active.time,
        }
      }
    }

    return json;
  }

  updateFromJSON(json) {
    // Set position
    if (json.position) {
      if (this.body) this.setPosition(json.position);
      this.snapshot.position_2.copy(json.position);
    }

    // Set rotation
    if (json.quaternion) {
      if (this.body) this.setRotation(json.quaternion);
      this.snapshot.quaternion_2.copy(json.quaternion);
    }

    if (json.model) {
      if (json.model.action) {
        // Update animation
        this.model.play(json.model.action.name, json.model.action.duration);
        this.model.actions[json.model.action.name].time = json.model.action.time;
      }
    }
  }
}

export { Entity };