// relies on vector.js
var FLOCKING = FLOCKING || (function () {
  return {};
})();

FLOCKING.Flock = function (numBoids = 0) {
  let Flock = FLOCKING.Flock;
  if (!(this instanceof Flock)) {
    return new Flock(numBoids);
  }

  this.boids = [];
  this.boidCount = 0;
  this.limits = [{ p1: new Vector(-100, -100, -100), p2: new Vector(100, 100, 100) }];

  this.bounds = { lower: new Vector(), upper: new Vector(), centre: new Vector() };

  let Boid = FLOCKING.Boid;

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
  // use insert sort
    //let tx = this.boids.slice().sort((a, b) => a.position.x - b.position.x);
    //let ty = this.boids.slice().sort((a, b) => a.position.y - b.position.y);
    //let tz = this.boids.slice().sort((a, b) => a.position.z - b.position.z);

    let lower = this.boids[0].position.clone();
    let upper = this.boids[0].position.clone();

    let boids = [];

    if (this.boidCount > this.boids.length)
      this.boidCount = this.boids.length;

    var octree1 = new Octree(new Vec3(-10, -10, -10), new Vec3(20, 20, 20));

    //let a = 0;
    //octree1.add(new Vec3(0,  0,   0), a++);
    //octree1.add(new Vec3(2,  1,   0), a++);
    //octree1.add(new Vec3(2,  2,   0), a++);
    //octree1.add(new Vec3(2,  3,   0), a++);
    //octree1.add(new Vec3(5,  0,   0), a++);
    //octree1.add(new Vec3(0,-12,   0), a++);
    //octree1.add(new Vec3(0, 0, -23), a++);

    //let nodes = octree1.findNearbyPoints(new Vec3(0, 0, 0), 50, { notSelf: true, includeData: true });
    //console.log(nodes);
    //debugger;
    var octree = new Octree(new Vec3(-100, -100, -100), new Vec3(200, 200, 200));

    for (let i = 0; i < this.boidCount; i++) {
      let bd = this.boids[i];
      let t = bd.position.toArray(3);
      let v = new Vec3(...t);
      octree.add(v, i);

      //// neighbour filter on range
      //// don't use native filter (for loop is quicker)
      //let tag = Math.ceil((bd.position.x + .5) /3);
      //if (boids[tag] == undefined) {
      //  boids[tag] = [bd];
      //} else {
      //  boids[tag].push(bd);
      //}

      // find limits
      lower.x = bd.position.x < lower.x ? bd.position.x : lower.x;
      lower.z = bd.position.z < lower.z ? bd.position.z : lower.z;

      upper.x = bd.position.x > upper.x ? bd.position.x : upper.x;
      upper.z = bd.position.z > upper.z ? bd.position.z : upper.z;
    }

    this.bounds.upper = upper;
    this.bounds.lower = lower;
    this.bounds.centre = upper.add(lower).divide(2);


    for (let i = 0; i < this.boidCount; i++) {
      bd = this.boids[i];

      let neighbourRadius = Math.min(bd.cohereNeighbourRadius, bd.alignNeighbourRadius, bd.separateNeighbourRadius);

      let res = octree.findNearbyPoints(new Vec3(...bd.position.toArray(3)), neighbourRadius, { notSelf: true, includeData: true });

      if (res.points.length < 10) {
        neighbourRadius = Math.max(bd.cohereNeighbourRadius, bd.alignNeighbourRadius, bd.separateNeighbourRadius);

        res = octree.findNearbyPoints(new Vec3(...bd.position.toArray(3)), neighbourRadius, { notSelf: true, includeData: true });
      }

      let neighbours = [];
      for (var j = 0; j < res.points.length; j++) {
        neighbours.push(this.boids[res.data[j]]);
      }

      bd.update(dt);

      let boidCount = Math.min(this.boidCount, neighbours.length);

      if (this.limits[bd.groupId] !== undefined)
        bd.steer(dt, neighbours, boidCount, this.limits[bd.groupId]);
      else
        bd.steer(dt, neighbours, boidCount, this.limits[0]);
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

FLOCKING.Boid = function ({ velocity = new Vector(0, 0, 1),
  position = new Vector(10, 0, 0),
  maxSpeed = 1,
  mesh = null
} = {}
) {
  let Boid = FLOCKING.Boid;

  if (!(this instanceof Boid)) {
    return new Boid();
  }

  this.mesh = mesh;
  this.mass = 1;
  this.velocity = velocity;
  this.position = position;
  this.maxSpeed = maxSpeed;
  this.maxAcceleration = 0.1;
  this.separateNeighbourRadius = 8;
  this.alignNeighbourRadius = 20;
  this.cohereNeighbourRadius = 10;
  this.cohereStrength = 1;
  this.alignStrength = 1;
  this.separateStrength = 1;
  this.radius = 1;
  this.groupId = 0;
  this.mix = 0;
  this.wrap = false;
  this.bound = true;
  this.mix = 0;
  this.hidden = false;

  this.heading = new Vector();
  // private
  let acceleration = new Vector(0, 0, 0);
  let neighboursSame = [];
  let neighboursOther = [];
  let separateNeighbourRadiusSq;
  let alignNeighbourRadiusSq;
  let cohereNeighbourRadiusSq;
  let radiusSq;

  const sqrt1_3 = Math.sqrt(1 / 3);

  this.getId = ((id) => {
    return () => id;
  })(Boid.getNextId());

  this.update = function (dt) {
    // Update using Euler method
    this.position = this.position.add(this.velocity.multiply(dt));
    this.velocity = this.velocity.add(acceleration.multiply(dt)).limit(this.maxSpeed);
    //if (this.velocity.length() < 0)
    //  this.velocity = this.velocity.setMag(1);
    this.heading = this.velocity;
  };

  this.steer = function (dt, boids, boidCount, limits) {
    getNeighbours(boids, boidCount);
    acceleration.zero();
    acceleration = acceleration.add(align(neighboursOther).multiply(this.alignStrength * this.mix));
    acceleration = acceleration.add(cohere(neighboursOther).multiply(this.cohereStrength * this.mix));
    // always apply a minimum to avoid collisions
    acceleration = acceleration.add(separate(neighboursOther).multiply(this.separateStrength * (1 + this.mix)));

    acceleration = acceleration.add(align(neighboursSame).multiply(this.alignStrength));
    acceleration = acceleration.add(separate(neighboursSame).multiply(this.separateStrength));
    acceleration = acceleration.add(cohere(neighboursSame).multiply(this.cohereStrength));
    acceleration = acceleration.limit(this.maxAcceleration);
    if (this.bound)
      acceleration = acceleration.add(limit(limits).multiply(.1));
    if (this.wrap)
      wrap(limits);
  };

  let getNeighbours = (boids, boidCount) => {
    neighboursSame = [];
    neighboursOther = [];
    let boid;

    radiusSq = this.radius * this.radius;

    separateNeighbourRadiusSq = this.separateNeighbourRadius;
    alignNeighbourRadiusSq = this.alignNeighbourRadius;
    cohereNeighbourRadiusSq = this.cohereNeighbourRadius;
    let neighbourRadius = Math.max(cohereNeighbourRadiusSq, alignNeighbourRadiusSq, separateNeighbourRadiusSq);
    let neighbourRadiusSq = neighbourRadius * neighbourRadius;

    // todo - only process boids in front, ignoring boids behind
    for (var i = 0; i < boidCount; i++) {
      boid = boids[i];
      if (boid.hidden) continue;

      let relativePosition = this.position.subtract(boid.position);

      let x = Math.abs(relativePosition.x);
      let y = Math.abs(relativePosition.y);
      let z = Math.abs(relativePosition.z);

      // quick reject
      let md = x + y + z;
      if (md > neighbourRadius)
        continue;
      //if (sqrt1_3 * md > neighbourRadius)
      //  continue;
      if (Math.max(x, y, z) > neighbourRadius)
        continue;




      let d = relativePosition.lengthSq();
      if (d < neighbourRadiusSq) {
        if (this.getId() === boid.getId()) continue;

        if (this.groupId === boid.groupId) {
          neighboursSame.push({ d, id: boid.getId(), velocity: boid.velocity, position: boid.position });
        } else {
          neighboursOther.push({ d, id: boid.getId(), velocity: boid.velocity, position: boid.position });
        }
      }
    }
    neighboursSame.sort((a,b) => a.d - b.d);
    neighboursOther.sort((a,b) => a.d - b.d);
  };

  let align = (neighbours) => {
    let countAligned = 0;
    let result = new Vector();

    let countLimit = 10;

    for (let i = 0; i < neighbours.length; i++) {
      if (neighbours[i].d < cohereNeighbourRadiusSq) {
        result = result.add(neighbours[i].velocity);
        countAligned++;
      }
      if (countAligned > countLimit) {
        break;
      }
    }

    if (countAligned > 0) {
      result = result.divide(countAligned);
      result = result.setMag(this.maxSpeed);
      // steering force
      result = result.subtract(this.velocity);
      result = result.limit(this.maxAcceleration);
    }
    return result;
  };

  let cohere = (neighbours) => {
    let countTooFar = 0;
    let result = new Vector();

    let countLimit = 10;
    let radius = this.radius * this.radius;

    for (let i = 0; i < neighbours.length; i++) {
      if (neighbours[i].d < alignNeighbourRadiusSq && neighbours[i].d > radius) {
        result = result.add(neighbours[i].position);
        countTooFar++;
      }
      if (countTooFar > countLimit) {
        break;
      }
    }
    if (countTooFar > 0) {
      // target is average
      result = result.divide(countTooFar);
      // vector to target
      result = result.subtract(this.position);
      result = result.setMag(this.maxSpeed);
      // steering force
      result = result.subtract(this.velocity);
      result = result.limit(this.maxAcceleration);
    }
    return result;
  };

  let separate = (neighbours) => {
    let countTooClose = 0;
    let result = new Vector();

    let countLimit = 10;

    for (let i = 0; i < neighbours.length; i++) {
      let d = neighbours[i].d;
      let pos = neighbours[i].position;
      if (d < separateNeighbourRadiusSq && d > 0) {
        let diff = this.position.subtract(pos).unit().divide(d);
        result = result.add(diff);
        countTooClose++;
      }
      if (countTooClose > countLimit) {
        break;
      }
    }

    if (countTooClose > 0) {
      result = result.divide(countTooClose);
      // direction to centre should be relative from current position
      result = result.setMag(this.maxSpeed);
      result = result.subtract(this.velocity);
      result = result.limit(this.maxAcceleration);
      //result = result.negative();
    }
    return result;
  };

  let limit = (limits) => {
    // distance from boundary
    let result = new Vector();
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
