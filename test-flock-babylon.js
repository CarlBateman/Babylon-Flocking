// see also C:\Users\Carl\Dropbox\Workshop\webgl-workshop-site-projects\webglworkshop\root\projects\flock
// and C:\Users\Carl\Documents\WIP\WebGLworkshop\root\projects\Flock
window.addEventListener('DOMContentLoaded', function () {
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

    var light = new BABYLON.DirectionalLight("Directionallight1", new BABYLON.Vector3(1, -1, 1), scene);
    var light2 = new BABYLON.DirectionalLight("Directionallight1", new BABYLON.Vector3(-1, -1, -1), scene);

    var n = 30;
    for (var i = 0; i < n; i++) {
      for (var j = 0; j < n; j++) {
        var gd = BABYLON.MeshBuilder.CreateGround("gd", { width: 4, height: 4, subdivisions: 4, sideOrientation: BABYLON.Mesh.DOUBLESIDE }, scene);
        gd.material = new BABYLON.StandardMaterial("coneMaterial", scene);
        gd.material.diffuseColor = new BABYLON.Color3(0, 0, 0);
        gd.material.specularColor = new BABYLON.Color3(0, 0, 0);
        gd.material.emissiveColor = new BABYLON.Color3(.1, .1, .3);
        gd.rotation.y = Math.PI / 3;
        gd.position.x = (-n / 2 + i) * 10;
        gd.position.z = (-n / 2 + j) * 10;
        gd.position.y = -5;
      }
    }

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
    //makeLabel(coneMaster);

    function makeLabel(parent) {
      let plane = BABYLON.MeshBuilder.CreatePlane("plane2", { width: 4, height: 4 }, scene);
      plane.parent = parent.mesh;
      //plane.boid_id = parent.id;
      plane.position.z = parent.id & 1 ? -1.5 : 1;
      plane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;

      let advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(plane);

      let textBlock = new BABYLON.GUI.TextBlock("but1", "Some Text");
      //textBlock.width = 1;
      textBlock.height = 0.2;
      //textBlock.resizeToFit = true;
      textBlock.color = "black";
      textBlock.fontSize = 50;
      textBlock.fontFamily = "Arial Narrow";
      // textblocks have no backgrounds. For that, they are put in a Rectangle container.
      textBlock.background = "green";
      // textblocks have no border thickness.  Maybe put inside a Rectangle container, again.
      //textBlock.thickness = 10;


      advancedTexture.addControl(textBlock);
      //advancedTexture.drawText("QQQ", null, null, "Arial Narrow", "black", 'transparent', true);
      textBlock.text = "id: " + parent.id;
      parent.label = textBlock;
    }

    let flock = FLOCKING.Flock();

    let numBoids = 10;
    for (let i = 0; i < numBoids; i++) {
      let boidPos = new BABYLON.Mesh("boid", scene);
      //boidPos.position.x = i;
      //boidPos.forward.z = i & 1 ? -1 : 1;

      let boidMesh = coneMaster.clone();
      boidMesh.material = new BABYLON.StandardMaterial("coneMaterial", scene);
      boidMesh.material.diffuseColor = new BABYLON.Color3(i / numBoids, Math.random(), 1 - i / numBoids);
      boidMesh.parent = boidPos;
      //cones.push(boidMesh);

      var bd = FLOCKING.Boid();
      bd.position.x = i;
      //bd.forward.z = i & 1 ? -1 : 1;

      bd.mesh = boidPos;
      //bd.position.x = i - 4;
      //bd.forward.z = i & 1 ? -1 : 1;

      bd.position.x = (Math.random() - .5) * numBoids / 1;
      bd.position.z = (Math.random() - .5) * numBoids / 1;
      if (i === 0) {
        bd.position.x = -1;//(Math.random() - .5) * numBoids / 1;
        bd.position.z = -1;//(Math.random() - .5) * numBoids / 1;
        //bd.position.y = (Math.random() - .5) * numBoids;
      }
      if (i === 1) {
        bd.position.x = 1;
        bd.position.z = -1;
      }
      if (i === 2) {
        bd.position.x = -1;
        bd.position.z = 1;
      }
      if (i === 3) {
        bd.position.x = 1;
        bd.position.z = 1;
      }






      flock.addBoid(bd);

      //makeLabel(bd);
    }

    let dt = 0.1;//clock.getDelta() / 1000;
    coneMaster.isVisible = false;

    //let boidCentre = new BABYLON.Mesh("boid", scene);
    //camera.setTarget(boidCentre);
    camera.setTarget(flock.boids[Math.ceil(numBoids / 2)].mesh);


    document.onkeyup = function () {
      dt = 0.1;
    };

    var origin = new Vector(0, 0, 0);
    scene.registerBeforeRender(function () {

      if (dt > 0)
        flock.update(dt);
      //dt = 0;

      //boidCentre.position.x = flock.bounds.centre.x;
      //boidCentre.position.y = flock.bounds.centre.y;
      //boidCentre.position.z = flock.bounds.centre.z;

      let scale = flock.bounds.centre.subtract(flock.bounds.lower);
      let dist = scale.length();
      dist = dist < 10 ? 10 : dist;

      let pos = camera.position.clone();
      pos.y = dist * 2;
      //camera.setPosition(pos);
      camera.radius = dist * 1.5;

      for (let i = 0; i < flock.boids.length; i++) {
        let bd = flock.boids[i];
        bd.mesh.setDirection(bd.forward);
        bd.mesh.position.x = bd.position.x;
        bd.mesh.position.y = bd.position.y;
        bd.mesh.position.z = bd.position.z;

        if (bd.label !== undefined) {
          bd.label.text = "id: " + bd.id + "\r\n" + bd.forward.x.toFixed(2) + ", " + bd.forward.z.toFixed(2);
        }
      }

    });

    return scene;
  };

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
  };
});
