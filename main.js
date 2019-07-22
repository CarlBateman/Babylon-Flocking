// see also C:\Users\Carl\Dropbox\Workshop\webgl-workshop-site-projects\webglworkshop\root\projects\flock
// and C:\Users\Carl\Documents\WIP\WebGLworkshop\root\projects\Flock
window.addEventListener('DOMContentLoaded', function () {
  var canvas = document.getElementById('renderCanvas');
  var engine = new BABYLON.Engine(canvas, true);

  var createScene = function () {
    var scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color3(0.5, 0.8, 0.75);

    var camera = new BABYLON.ArcRotateCamera('camera1', 0, 0, 1, new BABYLON.Vector3(0, 0, 0), scene);
    camera.setPosition(new BABYLON.Vector3(10, 8, -28));
    camera.attachControl(canvas, false);
    camera.wheelDeltaPercentage = 0.01;

    var light = new BABYLON.DirectionalLight("Directionallight1", new BABYLON.Vector3(1, -1, 1), scene);
    light.position = new BABYLON.Vector3(-40, 40, -40);
    var light2 = new BABYLON.DirectionalLight("Directionallight1", new BABYLON.Vector3(-1, 1, -1), scene);
    light2.intensity = .5;

    //var ground = BABYLON.MeshBuilder.CreateGround("gd", { width: 6, subdivisions: 4 }, scene);
    //var box = BABYLON.MeshBuilder.CreateBox("box", { size: 1 }, scene);
    //var cylinder = BABYLON.MeshBuilder.CreateCylinder("cylinder", { diameter: 19.5, height: 0.5, tessellation: 64 }, scene);


    var cone1 = BABYLON.MeshBuilder.CreateCylinder("cone", { diameterTop: 0, diameterBottom: 1.5, height: 1.5, tessellation: 4, updatable: true }, scene);
    var positions = cone1.getVerticesData(BABYLON.VertexBuffer.PositionKind);
    for (let i = 0; i < positions.length; i+=3) {
      if (positions[i + 1] < 0) {
        if (Math.abs(positions[i]) < 0.0001) {
          positions[i + 2] *= .5;
        }
      }
    }
    cone1.updateVerticesData(BABYLON.VertexBuffer.PositionKind, positions);
    cone1.rotation.x = Math.PI / 2;
    var cone2 = cone1.clone();
    cone2.position.y = .75;

    var material1 = new BABYLON.StandardMaterial("myMaterial", scene);
    material1.diffuseColor = new BABYLON.Color3(1, 0, 0);
    cone1.material = material1;

    var material2 = new BABYLON.StandardMaterial("myMaterial", scene);
    material2.diffuseColor = new BABYLON.Color3(0, 1, 0);
    cone2.material = material2;

    var boid1 = new BABYLON.Mesh("dummy", scene);
    boid1.position.x = 10;
    cone1.parent = boid1;

    var boid = { forward: new Vector(0, 0, 1), position: new Vector(10, 0, 0), speed: 1 };
    var boid2 = new BABYLON.Mesh("dummy", scene);
    //cone2.rotation.x = Math.PI / 2;
    cone2.parent = boid2;

    var cone = cone1.clone();
    var dummy = new BABYLON.Mesh("dummy", scene);
    cone.parent = dummy;
    cone.material = new BABYLON.StandardMaterial("myMaterial", scene);
    cone.material.diffuseColor = new BABYLON.Color3(0, 0, 1);
    cone.position.y = -.75;

    var bd = makeBoid({ speed: 2 });
    bd.mesh = dummy;



    // flock
    // boid
    // find neighbours
    // hash
    // move
    // steer
    //   separation: steer to avoid crowding local flockmates
    //   alignment: steer towards the average heading of local flockmates
    //   cohesion: steer to move towards the average position(center of mass) of local flockmates
    // flocks
    // avoid objects
    // follow leader

    function findNearestNeighbours(flock, numNeighbours) {
      // hash encode position
      for (let i = 0; i < flock.length; i++) {
        ;
      }
    }

    var origin = new Vector(0, 0, 0);
    scene.registerBeforeRender(function () {
      let dt = .1;//clock.getDelta() / 100;
      bd.rotateAbout(origin, dt, 11);
      // sync mesh with boid
      bd.mesh.setDirection(bd.forward);
      bd.mesh.position.x = bd.position.x;
      bd.mesh.position.y = bd.position.y;
      bd.mesh.position.z = bd.position.z;


      // move around some point (origin (0,0,0))

      // get the distance from the origin
      let d2 = boid.position.subtract(origin).length();
      // move forward
      let fwd2 = boid.forward.multiply(dt * boid.speed);
      let p2 = boid.position.add(fwd2);

      // normalise the new positon relative to the origin 
      p2 = p2.subtract(origin);
      p2 = p2.unit();
      p2 = p2.multiply(d2);

      // derive the new forward (new pos - old pos)
      boid.forward = p2.subtract(boid.position);
      boid.forward = boid.forward.unit();
      boid.position = p2;

      boid2.setDirection(boid.forward);
      boid2.position.x = boid.position.x;
      boid2.position.y = boid.position.y;
      boid2.position.z = boid.position.z;

      

      // get the distance from the origin
      let d1 = BABYLON.Vector3.Distance(boid1.position, new BABYLON.Vector3.Zero());
      // move forward
      let fwd1 = boid1.forward.scale(dt);

      // normalise the new positon relative to the origin 
      let p1 = boid1.position.add(fwd1);
      let v1 = p1.subtract(new BABYLON.Vector3.Zero());
      p1 = BABYLON.Vector3.Normalize(v1);
      p1.scaleInPlace(d1);

      // derive the new forward (new pos - old pos)
      let t1 = BABYLON.Vector3.Normalize(p1.subtract(boid1.position));

      boid1.setDirection(BABYLON.Vector3.Normalize(p1.subtract(boid1.position)));
      boid1.position = p1;
    });

    return scene;
  }

  var scene = createScene();

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
  }
});
