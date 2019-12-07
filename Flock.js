// relies on vec3.js
// relies on octree.js
var FLOCKING = FLOCKING || (function () {
  return {};
})();

FLOCKING.Target = function () {
  this.position = new Vec3();
  this.inner = 1;
  this.outer = 10;
};

FLOCKING.Flock = function (numBoids = 0) {
  let Flock = FLOCKING.Flock;
  if (!(this instanceof Flock)) {
    return new Flock(numBoids);
  }

  this.boids = [];
  this.predators = [];
  this.targets = [];
  this.boidCount = 0;
  this.numberOfNeighbours = 10;
  let needsUpdate = true;

  this.limits = [{ p1: new Vec3(-100, -100, -100), p2: new Vec3(100, 100, 100) }];

  this.bounds = { lower: new Vec3(), upper: new Vec3(), centre: new Vec3() };

  let Boid = FLOCKING.Boid;

  this.addTarget = function (target) {
    this.targets.push(target);
  };

  this.addBoid = function (nboid) {
    if (nboid instanceof Boid) {
      this.boids.push(nboid);
    } else {
      this.boids.push(Boid());
    }
    this.boidCount = this.boids.length;
  };

  this.addBoids = function (nboids = 1) {
    if (Array.isArray(nboids)) {
      this.boids = this.boids.concat(nboids);
    } else
      for (var i = 0; i < nboids; i++) {
        this.boids.push(Boid());
      }
    this.boidCount = this.boids.length;
  };
  this.addBoids(numBoids);

  this.update = function (dt = 0) {
    let lower = this.boids[0].position.clone();
    let upper = this.boids[0].position.clone();

    let boids = [];

    if (this.boidCount > this.boids.length)
      this.boidCount = this.boids.length;

    // groups!!!
    let octrees = [];
    for (var i = 0; i < 3; i++) {
      octrees[i] = new Octree(new Vec3(-110, -110, -110), new Vec3(220, 220, 220));
    }

    for (let i = 0; i < this.boidCount; i++) {
      let bd = this.boids[i];
      octrees[bd.groupId].add(bd.position, i);

      // find limits
      lower.x = bd.position.x < lower.x ? bd.position.x : lower.x;
      lower.z = bd.position.z < lower.z ? bd.position.z : lower.z;

      upper.x = bd.position.x > upper.x ? bd.position.x : upper.x;
      upper.z = bd.position.z > upper.z ? bd.position.z : upper.z;
    }

    this.bounds.upper = upper;
    this.bounds.lower = lower;
    this.bounds.centre = upper.add(lower).scale(1 / 2);

    if (needsUpdate) {
      let res = [];
      for (let i = 0; i < this.boidCount; i++) {
        bd = this.boids[i];

        /////////////////////////////////////////////////
        // maybe this should be a function
        let radius = 2;
        let happy = false;

        while (!happy) {
          res[bd.groupId] = octrees[bd.groupId].findNearbyPoints(bd.position, radius, { notSelf: true, includeData: true });

          if (res[bd.groupId].points.length < this.numberOfNeighbours) {
            radius += 1;
            if (radius > 256) {
              happy = true;
            }
          } else {
            happy = true;
          }
        }

        // get res for other groups at same radius
        for (var j = 0; j < 3; j++) {
          if (j !== bd.groupId) {
            res[j] = octrees[j].findNearbyPoints(bd.position, radius, { notSelf: true, includeData: true });
          }
        }
        // maybe this should be a function
        /////////////////////////////////////////////////

        let neighbours = [];
        for (var k = 0; k < 3; k++) {
          for (var j = 0; j < res[k].points.length; j++) {
            neighbours.push(this.boids[res[k].data[j]]);
          }
        }

        bd.update(dt);

        let boidCount = Math.min(this.boidCount, neighbours.length);

        if (this.limits[bd.groupId] !== undefined)
          bd.steer(dt, neighbours, boidCount, this.limits[bd.groupId], this.targets);
        else
          bd.steer(dt, neighbours, boidCount, this.limits[0], this.targets);
      }
      needsUpdate = false;
    } else {
      for (let i = 0; i < this.boidCount; i++) {
        bd = this.boids[i];
        bd.update(dt);
      }
      needsUpdate = true;
    }
  };

  this.removeBoids = function (numBoids) {
    let start = this.boids.length - numBoids;
    this.boids.splice(start, numBoids);
    this.boidCount = this.boids.length;
  };

  // number of boids to show (regardless of hidden)
  this.showBoids = function (numBoids = this.boidCount) {
    this.boidCount = numBoids;
  };

  this.hideGroups = function (groupIds) {
    for (var i = 0; i < this.boids.length; i++) {
      if (groupIds.includes(boids[i].groupId)) {
        boids[i].hidden = true;
      }
    }
  };

  this.unhideGroups = function (groupIds) {
    for (var i = 0; i < this.boids.length; i++) {
      if (groupIds.includes(boids[i].groupId)) {
        boids[i].hidden = false;
      }
    }
  };
};


FLOCKING.Boid = function (options) {
  if (typeof options !== "object" && typeof options !== "undefined" ) {
    throw "FLOCKING.Boid options must be an object or undefined";
  }

  let Boid = FLOCKING.Boid;
  if (!(this instanceof Boid)) {
    return new Boid(options);
  }

  let defaults = Boid.getDefaults();

  if (typeof options === "undefined") {
    for (let [key, value] of Object.entries(defaults)) {
      this[key] = value;
    }
  } else {
    for (let [key, value] of Object.entries(defaults)) {
      if (key in options)
        this[key] = options[key];
      else
        this[key] = value;
    }
  }

  // private
  let acceleration = new Vec3(0, 0, 0);
  let neighboursSame = [];
  let neighboursOther = [];
  let separateNeighbourRadiusSq;
  let alignNeighbourRadiusSq;
  let cohereNeighbourRadiusSq;

  this.getId = ((id) => {
    return () => id;
  })(Boid.getNextId());

  this.update = function (dt) {
    // Update using Euler method
    this.position = this.position.add(this.velocity.scale(dt));
    this.velocity = this.velocity.add(acceleration.scale(dt)).limit(this.maxSpeed);
    //if (this.velocity.length() < 0)
    //  this.velocity = this.velocity.setMag(1);
    this.heading = this.velocity.normalize();
  };

  this.steer = function (dt, boids, boidCount, limits, targets) {
    getNeighbours(boids, boidCount);
    acceleration.setZero();
    //acceleration = acceleration.add(wiggle().scale(dt));
    acceleration = acceleration.add(align(neighboursOther).scale(this.alignStrength * this.mix));
    acceleration = acceleration.add(cohere(neighboursOther).scale(this.cohereStrength * this.mix));
    // always apply a minimum to avoid collisions
    acceleration = acceleration.add(separate(neighboursOther).scale(this.separateStrength));
    //acceleration = acceleration.add(separate(neighboursOther).scale(this.separateStrength * (1 + this.mix)));

    acceleration = acceleration.add(align(neighboursSame).scale(this.alignStrength));
    acceleration = acceleration.add(separate(neighboursSame).scale(this.separateStrength));
    acceleration = acceleration.add(cohere(neighboursSame).scale(this.cohereStrength));
    if (targets !== undefined)
      acceleration = acceleration.add(target(targets));

    //acceleration = acceleration.add(clump(neighboursOther));
    //acceleration = acceleration.add(clump(neighboursSame));

    if (this.mass !== 0) {
      acceleration = acceleration.scale(1 / this.mass);
    }
    acceleration = acceleration.limit(this.maxAcceleration);
    if (this.bound)
      acceleration = acceleration.add(limit(limits).scale(.1));
    if (this.wrap)
      wrap(limits);
  };

  let getNeighbours = (boids, boidCount) => {
    neighboursSame = [];
    neighboursOther = [];
    let boid;

    separateNeighbourRadiusSq = this.separateNeighbourRadius * this.separateNeighbourRadius;
    alignNeighbourRadiusSq = this.alignNeighbourRadius * this.alignNeighbourRadius;
    cohereNeighbourRadiusSq = this.cohereNeighbourRadius * this.cohereNeighbourRadius;

    for (var i = 0; i < boidCount; i++) {
      boid = boids[i];
      if (boid.hidden) continue;

      if (this.getId() === boid.getId()) continue;


      // only process boids in front, ignoring boids behind
      if (this.position.angleTo(boid.position) > Math.PI/2)
        continue;

      let d = this.position.squareDistance(boid.position);

      if (this.groupId === boid.groupId) {
        neighboursSame.push({ d, id: boid.getId(), velocity: boid.velocity, position: boid.position });
      } else {
        neighboursOther.push({ d, id: boid.getId(), velocity: boid.velocity, position: boid.position });
      }
    }
    neighboursSame.sort((a, b) => a.d - b.d);
    neighboursOther.sort((a, b) => a.d - b.d);
  };

  let align = (neighbours) => {
    let countAligned = 0;
    let result = new Vec3();

    for (let i = 0; i < neighbours.length; i++) {
      if (neighbours[i].d < alignNeighbourRadiusSq) {
        result.add(neighbours[i].velocity);
        countAligned++;
      }
      if (countAligned > this.numberOfNeighbours) {
        break;
      }
    }

    if (countAligned > 0) {
      result.scale(1/countAligned);
      result.setMag(this.maxSpeed);
      // steering force
      result.sub(this.velocity);
      result.limit(this.maxAcceleration);
    }
    return result;
  };

  let cohere = (neighbours) => {
    let countTooFar = 0;
    let result = new Vec3();

    let radiusSq = this.radius * this.radius * 2;

    for (let i = 0; i < neighbours.length; i++) {
      if (neighbours[i].d < cohereNeighbourRadiusSq && neighbours[i].d > radiusSq) {
        result.add(neighbours[i].position);
        countTooFar++;
      }
      if (countTooFar > this.numberOfNeighbours) {
        break;
      }
    }
    if (countTooFar > 0) {
      // target is average
      result.scale(1/countTooFar);
      // vector to target
      result.sub(this.position);
      result.setMag(this.maxSpeed);
      // steering force
      result.sub(this.velocity);
      result.limit(this.maxAcceleration);
    }
    return result;
  };

  let separate = (neighbours) => {
    let countTooClose = 0;
    let result = new Vec3();

    for (let i = 0; i < neighbours.length; i++) {
      let d = neighbours[i].d;
      let pos = neighbours[i].position;
      if (d < separateNeighbourRadiusSq && d > 0) {
        let distToRadius = this.position.clone().sub(pos).length();
        distToRadius -= this.radius;
        distToRadius *= distToRadius;
        let diff = this.position.clone().sub(pos).scale(1 / distToRadius);
        result.add(diff);
        countTooClose++;
      }
      if (countTooClose > this.numberOfNeighbours) {
        break;
      }
    }

    if (countTooClose > 0) {
      result.scale(1 / countTooClose);
      // direction to centre should be relative to current position
      result.setMag(this.maxSpeed);
      result.sub(this.velocity);
      result.limit(this.maxAcceleration);
    }
    return result;
  };

  let target = (targets) => {
    let count = 0;
    let result = new Vec3(0, 0, 0);
    for (let i = 0; i < targets.length; i++) {
      let innerSq = targets[i].inner * targets[i].inner;
      let outerSq = targets[i].outer * targets[i].outer;

      let relativePositon = this.position.clone().sub(targets[i].position);
      let distSq = relativePositon.lengthSquared();

      if (distSq < outerSq && distSq > innerSq) {
        let distToInner = Math.sqrt(distSq) - targets[i].inner;
        let dirToTarget = relativePositon.clone().normalize();
        let forceToTarget = dirToTarget.scale(1 / (distToInner ));

        let direction = this.velocity.clone().normalize();

        result = result.add(forceToTarget);
        count++;
      }
    }
    if (count > 0) {
      result.negative();
      result = result.scale(1 / count);
      result.setMag(this.maxSpeed);
      result.sub(this.velocity);
      result.limit(this.maxAcceleration);
    }
    return result;
  };

  let barriers = () => {
    let countTooFar = 0;
    let result = new Vec3(0, 0, 0);
    //for (let i = 0; i < neighbours.length; i++) {
    //  if (self.position.sub(neighbours[i]) > maxSeparation) {
    //    result = result.add(neighbours[i].position);
    //    countTooFar++;
    //  }
    //}
    //result = result.scale(1/countTooFar);
    result.sub(this.position);
    result.unit();
    return result;
  };




  let wiggle = () => {
    // generate point along normal to velocity
    let x = Math.random() - .5;
    let y = Math.random() - .5;
    let z = Math.random() - .5;
    let v = new Vec3(x, y, z);
    v = v.scale(this.velocity).unit();
    return this.velocity.unit().scale(10).add(v).limit(this.maxAcceleration);
  };

  let clump = (neighbours) => {
    let countTooFar = 0;
    let result = new Vec3(0, 0, 0);
    //for (let i = 0; i < neighbours.length; i++) {
    //  if (self.position.sub(neighbours[i]) > maxSeparation) {
    //    result = result.add(neighbours[i].position);
    //    countTooFar++;
    //  }
    //}
    //result = result.scale(1/countTooFar);
    result.sub(this.position);
    result.unit();
    return result;
  };

  let repelLimit = ()=> {
  };

  let limit = (limits) => {
    // distance from boundary
    let result = new Vec3();
    if (this.position.x < limits.p1.x) {
      result.x = limits.p1.x - this.position.x;
    } else if (this.position.x > limits.p2.x) {
      result.x = limits.p2.x - this.position.x;
    }

    if (this.position.y < limits.p1.y) {
      result.y = limits.p1.y - this.position.y;
    } else if (this.position.y > limits.p2.y) {
      result.y = limits.p2.y - this.position.y;
    }

    if (this.position.z < limits.p1.z) {
      result.z = limits.p1.z - this.position.z;
    } else if (this.position.z > limits.p2.z) {
      result.z = limits.p2.z - this.position.z;
    }

    return result;
  };

  let wrap = (limits) => {
    let pos = this.position;
    if (pos.x > limits.p2.x) pos.x += limits.p1.x * 2;
    if (pos.x < limits.p1.x) pos.x += limits.p2.x * 2;

    if (pos.y > limits.p2.y) pos.y += limits.p1.y * 2;
    if (pos.y < limits.p1.y) pos.y += limits.p2.y * 2;

    if (pos.z > limits.p2.z) pos.z += limits.p1.z * 2;
    if (pos.z < limits.p1.z) pos.z += limits.p2.z * 2;
  };
};

(function () {
  var idx = 0;
  this.getNextId = function () {
    return idx++;
  };
}).call(FLOCKING.Boid);

(function () {
  defaults = {
    mass: 1,
    velocity: new Vec3(0, 0, 1),
    position: new Vec3(0, 0, 0),
    maxSpeed: 1,
    maxAcceleration: 0.1,
    numNeighbours: 8,
    separateNeighbourRadius: 8,
    alignNeighbourRadius: 20,
    cohereNeighbourRadius: 10,
    cohereStrength: 1,
    alignStrength: 1,
    separateStrength: 1,
    radius: 1,
    groupId: 0,
    mix: 0,
    wrap: true,
    bound: false,
    hidden: false,
    separateNumberOfNeighbours: 10,
    alignNumberOfNeighbours: 10,
    cohereNumberOfNeighbours: 10,
    heading: new Vec3(),
  };

  this.getDefaults = function () {
    return clone(defaults);
  };

  this.addDefault = function (name, value) {
    defaults[name] = value;
  };

  this.setDefault = function (name, value) {
    defaults[name] = value;
  };

  // taken from https://davidwalsh.name/javascript-clone
  function clone(src) {
    function mixin(dest, source, copyFunc) {
      var name, s, i, empty = {};
      for (name in source) {
        // the (!(name in empty) || empty[name] !== s) condition avoids copying properties in "source"
        // inherited from Object.prototype.	 For example, if dest has a custom toString() method,
        // don't overwrite it with the toString() method that source inherited from Object.prototype
        s = source[name];
        if (!(name in dest) || (dest[name] !== s && (!(name in empty) || empty[name] !== s))) {
          dest[name] = copyFunc ? copyFunc(s) : s;
        }
      }
      return dest;
    }

    if (!src || typeof src != "object" || Object.prototype.toString.call(src) === "[object Function]") {
      // null, undefined, any non-object, or function
      return src;	// anything
    }
    if (src.nodeType && "cloneNode" in src) {
      // DOM Node
      return src.cloneNode(true); // Node
    }
    if (src instanceof Date) {
      // Date
      return new Date(src.getTime());	// Date
    }
    if (src instanceof RegExp) {
      // RegExp
      return new RegExp(src);   // RegExp
    }
    var r, i, l;
    if (src instanceof Array) {
      // array
      r = [];
      for (i = 0, l = src.length; i < l; ++i) {
        if (i in src) {
          r.push(clone(src[i]));
        }
      }
      // we don't clone functions for performance reasons
      //		}else if(d.isFunction(src)){
      //			// function
      //			r = function(){ return src.apply(this, arguments); };
    } else {
      // generic objects
      r = src.constructor ? new src.constructor() : {};
    }
    return mixin(r, src, clone);

  }
}).call(FLOCKING.Boid);

