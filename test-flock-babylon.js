// see also C:\Users\Carl\Dropbox\Workshop\webgl-workshop-site-projects\webglworkshop\root\projects\flock
// and C:\Users\Carl\Documents\WIP\WebGLworkshop\root\projects\Flock
window.addEventListener('DOMContentLoaded', function () {
  function properties(value, min, max, step, name) {
    if (arguments.length === 1)
      return value;

    return { value, min, max, step, name, default: value };
  }
  let options = {
    numberOfBoids: properties(200, 1, 500, 1, "№ of boids"),
    pause: properties(false),
    shadows: properties(false),
    //pause: properties(false),
    maxSpeed: properties(2, 0, 50, .1),
    maxAcceleration: properties(.2, 0, 10, .1),
    minSeparation: properties(3, 0, 100, .5),
    maxSeparation: properties(10, 1, 100, .5),
    cohesion: {
      folder: true,
      neighbourRadius: properties(10, 0, 50, 1),
      use: properties(true),
      factor: properties(1, .1, 10, .1)
    },
    align: {
      folder: true,
      neighbourRadius: properties(20, 0, 50, 1),
      use: properties(true),
      factor: properties(1, .1, 10, .1)
    },
    separate: {
      folder: true,
      neighbourRadius: properties(8, 0, 50, 1),
      use: properties(true),
      factor: properties(1, .1, 10, .1)
    }
  };

  let gui = new dat.GUI();

  options.restoreDefaults = function (options) {
    gui.__controllers.forEach(controller => controller.setValue(controller.initialValue));
  };

  gui.add(options, "restoreDefaults");

  setupGUI(options, gui);

  function setupGUI(options, gui) {
    let keys = Object.keys(options);
    for (var i = 0; i < keys.length; i++) {
      let key = keys[i];
      if (key === "folder")
        continue;

      let option = options[key];

      if (option.folder === undefined) {
        if (option.min === undefined) {
          gui.add(options, key);
        } else {
          gui.add(option, "value", option.min, option.max).name(option.name === undefined ? key : option.name);
        }
      } else {
        let folder = gui.addFolder(key);
        setupGUI(option, folder);
      }
    }
  }

  var canvas = document.getElementById('renderCanvas');
  var engine = new BABYLON.Engine(canvas, true);

  var createScene = function () {
    var scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color3(0.05, 0.05, 0.2);

    var camera = new BABYLON.ArcRotateCamera('camera1', 0, 0, 1, new BABYLON.Vector3(0, 0, 0), scene);
    camera.upperAlphaLimit = 100;
    camera.upperBetaLimit = 100;
    camera.lowerAlphaLimit = -100;
    camera.lowerBetaLimit = -100;
    camera.setPosition(new BABYLON.Vector3(-50, 50, -50));
    camera.alpha = Math.PI * 1.5;
    camera.attachControl(canvas, false);
    camera.wheelDeltaPercentage = 0.01;

    var light1 = new BABYLON.DirectionalLight("Directionallight1", new BABYLON.Vector3(1, -1, 1), scene);
    light1.position = new BABYLON.Vector3(-100, 400, -400);
    var shadowGenerator = new BABYLON.ShadowGenerator(1024*4, light1);
    //light1.shadowMaxZ = 130;
    //light1.shadowMinZ = 10;
    //shadowGenerator.useContactHardeningShadow = true;
    //shadowGenerator.contactHardeningLightSizeUVRatio = 0.05;
    shadowGenerator.setDarkness(0.5);
    //shadowGenerator.usePoissonSampling = true;
    shadowGenerator.useBlurExponentialShadowMap = true;
    shadowGenerator.useKernelBlur = true;
    shadowGenerator.blurKernel = 16;
    var light2 = new BABYLON.DirectionalLight("Directionallight1", new BABYLON.Vector3(-1, -1, -1), scene);

    var gd = BABYLON.MeshBuilder.CreateGround("gd", { width: 2000, height: 2000, sideOrientation: BABYLON.Mesh.DOUBLESIDE }, scene);
    gd.position.y = -30;
    gd.material = new BABYLON.StandardMaterial("coneMaterial", scene);
    gd.material.diffuseTexture = new BABYLON.Texture("background.gif", scene);
    gd.material.diffuseTexture.uScale = 50;
    gd.material.diffuseTexture.vScale = 50;
    gd.material.specularColor = new BABYLON.Color3(.1, .1, .25);
    gd.receiveShadows = true;

    light2.excludedMeshes.push(gd);

    function makeFlatCone() {
      let cone = BABYLON.MeshBuilder.CreateCylinder("cone", { diameterTop: 0, diameterBottom: 1.5, height: 1.5, tessellation: 4, updatable: true }, scene);
      let positions = cone.getVerticesData(BABYLON.VertexBuffer.PositionKind);
      for (let i = 0; i < positions.length; i += 3) {
        if (positions[i + 1] < 0) {
          if (Math.abs(positions[i]) < 0.0001) {
            positions[i + 2] *= .5;
          }
        }
      }
      cone.updateVerticesData(BABYLON.VertexBuffer.PositionKind, positions);
      cone.rotation.x = Math.PI / 2;

      let material = new BABYLON.StandardMaterial("coneMaterial", scene);
      material.diffuseColor = new BABYLON.Color3(Math.random(), Math.random(), Math.random());
      cone.material = material;

      return cone;
    }

    let coneMaster = makeFlatCone();

    let flock = FLOCKING.Flock();

    let numBoids = 500;
    let stepX = Math.ceil(Math.sqrt(numBoids));
    let stepY = Math.ceil(numBoids / stepX);

    let x = 0, y = 0;
    for (let i = 0; i < numBoids; i++) {
      let groupId = i % 3;

      let boidPos = new BABYLON.Mesh("boid", scene);
      let boidMesh = coneMaster.clone();
      boidMesh.material = new BABYLON.StandardMaterial("coneMaterial", scene);
      //boidMesh.material.diffuseColor = new BABYLON.Color3(i / numBoids, Math.random(), 1 - i / numBoids);

      let r = groupId === 0? 1 : 0.25;
      let g = groupId === 1? 1 : 0.25;
      let b = groupId === 2? 1 : 0.25;

      boidMesh.material.diffuseColor = new BABYLON.Color3(r,g,b);
      boidMesh.parent = boidPos;

      shadowGenerator.addShadowCaster(boidMesh);

      // offset mesh from centre
      boidMesh.position.z = -.75;

      var bd = FLOCKING.Boid();
      bd.groupId = groupId;
      bd.mesh = boidPos;

      x = i % stepX - (stepX/2);
      y = Math.floor(i / stepY) - (stepY/2);

      let randomJitter = 2;
      bd.position.x = x * 4 + (.5 - Math.random()) * randomJitter;
      bd.position.z = y * 4 + (.5 - Math.random()) * randomJitter;
      //bd.position.x -= 50;
      //bd.position.z -= 50;

      //bd.position.x = x * 4 * randomJitter;
      //bd.position.z = y * 4 * randomJitter;
      let angle = Math.random() * Math.PI * 2;
      bd.velocity.x = Math.cos(angle);
      bd.velocity.z = Math.sin(angle);
      //bd.velocity = bd.velocity.unit();

      flock.addBoid(bd);
    }

    coneMaster.isVisible = false;

    //camera.setTarget(flock.boids[Math.ceil(numBoids / 2)].mesh);

    function updateBoidProperties(boid, options) {
      boid.maxSpeed = options.maxSpeed.value;
      boid.maxAcceleration = options.maxAcceleration.value;
      boid.minSeparation = options.minSeparation.value;
      boid.maxSeparation = options.maxSeparation.value;

      if (options.cohesion.use) {
        boid.cohereNeighbourRadius = options.cohesion.neighbourRadius.value;
        boid.cohereFactor = options.cohesion.factor.value;
      } else {
        boid.cohereFactor = 0;
      }

      if (options.align.use) {
        boid.alignFactor = options.align.factor.value;
        boid.alignNeighbourRadius = options.align.neighbourRadius.value;
      } else {
        boid.alignFactor = 0;
      }

      if (options.separate.use) {
        boid.separateNeighbourRadius = options.separate.neighbourRadius.value;
        boid.separateFactor = options.separate.factor.value;
      } else {
        boid.separateFactor = 0;
      }
    }

    scene.registerBeforeRender(function () {
      gd.receiveShadows = options.shadows;

      let boidCount = Math.ceil(options.numberOfBoids.value);
      flock.boidCount = boidCount;
      for (var i = 0; i < boidCount; i++) {
        updateBoidProperties(flock.boids[i], options);
      }

      let dt = clock.getDelta() / 100;//0.1;//

      if (dt > 0.5)
        dt = .1;
      if (!options.pause)
        flock.update(dt);

      // track flock motion with camera
      if (false) {
        let scale = flock.bounds.upper.subtract(flock.bounds.lower);
        let dist = scale.length();
        dist = dist < 10 ? 30 : dist;
        dist = dist > 50 ? 50 : dist;
        //dist = 10;
        let pos = camera.position.clone();
        pos.y = dist * 3;
        camera.radius = dist * 1.5;
        camera.position.x = flock.bounds.centre.x + 100;
      }

      //camera.setTarget(new BABYLON.Vector3(flock.bounds.centre.x, flock.bounds.centre.y, flock.bounds.centre.z));

      // update position and orientation of meshes
      for (let i = 0; i < flock.boids.length; i++) {
        let bd = flock.boids[i];
        if (i >= boidCount) {
          bd.mesh.getChildMeshes(false)[0].visibility = false;
        } else {
          bd.mesh.setDirection(bd.heading);
          bd.mesh.position.x = bd.position.x;
          bd.mesh.position.y = bd.position.y;
          bd.mesh.position.z = bd.position.z;
          bd.mesh.getChildMeshes(false)[0].visibility = true;
        }
      }
    });

    return scene;
  };

  engine.runRenderLoop(function () {
    scene.render();
  });

  window.addEventListener('resize', function () {
    engine.resize();
  });

  // Put this ﻿at the end of all the JavaScript, since it starts immediately.
  var clock = {
    before: performance.now(),
    getDelta: function () {
      var now = performance.now();
      var delta = now - this.before;
      this.before = now;
      return delta;
    }
  };

  var scene = createScene();
});
