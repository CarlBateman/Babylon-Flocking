// see also C:\Users\Carl\Dropbox\Workshop\webgl-workshop-site-projects\webglworkshop\root\projects\flock
// and C:\Users\Carl\Documents\WIP\WebGLworkshop\root\projects\Flock
window.addEventListener('DOMContentLoaded', function () {
  var canvas = document.getElementById('renderCanvas');
  var engine = new BABYLON.Engine(canvas, true);

  var createScene = function () {
    var scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color3(0.5, 0.8, 0.75);

    var camera = new BABYLON.ArcRotateCamera('camera1', 0, 0, 1, new BABYLON.Vector3(0, 0, 0), scene);
    camera.upperAlphaLimit = 100;
    camera.upperBetaLimit = 100;
    camera.lowerAlphaLimit = -100;
    camera.lowerBetaLimit = -100;
    camera.setPosition(new BABYLON.Vector3(10, 8, -28));
    camera.setPosition(new BABYLON.Vector3(0, 50, 0));
    camera.alpha = Math.PI * 1.5;
    //camera.beta = -Math.PI / 10;
    camera.attachControl(canvas, false);
    camera.wheelDeltaPercentage = 0.01;

    var light = new BABYLON.DirectionalLight("Directionallight1", new BABYLON.Vector3(1, -1, 1), scene);
    light.position = new BABYLON.Vector3(-40, 40, -40);
    var light2 = new BABYLON.DirectionalLight("Directionallight1", new BABYLON.Vector3(-1, 1, -1), scene);
    light2.intensity = .5;


    var n = 10;
    for (var i = 0; i < n; i++) {
      for (var j = 0; j < n; j++) {
        var gd = BABYLON.MeshBuilder.CreateGround("gd", { width: 3, height: 3, subdivisions: 4, sideOrientation: BABYLON.Mesh.DOUBLESIDE }, scene);
        gd.material = new BABYLON.StandardMaterial("coneMaterial", scene);
        gd.material.diffuseColor = new BABYLON.Color3(.75 + Math.random() / 4, .75 + Math.random() / 4, .75);
        gd.rotation.y = 1;//Math.Pi / 3;
        gd.position.x = (-n/2 + i) * n;
        gd.position.z = (-n/2 + j) * n;
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
      plane.position.z = parent.id & 1 ? -1.5 :1;
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

    let flock = makeFlock();

    let cones = [];
    let numBoids = 38;
    for (let i = 0; i < numBoids; i++) {
      let boidPos = new BABYLON.Mesh("boid", scene);
      //boidPos.position.x = i;
      //boidPos.forward.z = i & 1 ? -1 : 1;

      let boidMesh = coneMaster.clone();
      boidMesh.material = new BABYLON.StandardMaterial("coneMaterial", scene);
      boidMesh.material.diffuseColor = new BABYLON.Color3(i / numBoids, Math.random(), 1 - i / numBoids);
      boidMesh.parent = boidPos;
      //cones.push(boidMesh);

      var bd = makeBoid();
      bd.position.x = i;
      //bd.forward.z = i & 1 ? -1 : 1;

      bd.mesh = boidPos;
      bd.position.x = i - 4;
      bd.forward.z = i & 1 ? -1 : 1;

      flock.add(bd);

      //makeLabel(bd);
    }

    let dt = 0.1;//clock.getDelta() / 1000;
    coneMaster.isVisible = false;
    camera.setTarget(flock.boids[Math.ceil(numBoids / 2)].mesh);


    document.onkeyup = function () {
      dt = 0.1;
    };

    var origin = new Vector(0, 0, 0);
    scene.registerBeforeRender(function () {

    if(dt>0)
      flock.update(dt);
      //dt = 0;

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
