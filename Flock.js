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
  this.limits = [{ p1: new Vector(-25, -25, -25), p2: new Vector(25, 25, 25) }];

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

    let bd;

    let boids = [];

    if (this.boidCount > this.boids.length)
      this.boidCount = this.boids.length;

    for (let i = 0; i < this.boidCount; i++) {
      bd = this.boids[i];

      //// neighbour filter on range
      //// don't use native filter (for is quicker)
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

      bd.steer(dt, this.boids, this.boidCount, this.limits[0]);
    }

    this.bounds.upper = upper;
    this.bounds.lower = lower;
    this.bounds.centre = upper.add(lower).divide(2);

    for (let i = 0; i < this.boidCount; i++) {
      bd = this.boids[i];
      //let tag = Math.ceil((bd.position.x + .5) / 3);
      //let bds = boids[tag];
      //tag = Math.ceil((bd.position.x + 3.5) / 3);
      //if (boids[tag] !== undefined)
      //  bds = bds.concat(boids[tag]);
      //tag = Math.ceil((bd.position.x - 3.5) / 3);
      //if (boids[tag] !== undefined)
      //  bds = bds.concat(boids[tag]);

      //bd.steer(dt, bds);
      bd.update(dt);
    }
  };

  this.removeBoids = function (numBoids) {
    let start = this.boids.length - numBoids;
    this.boids.splice(start, numBoids);
    this.boidCount = this.boids.length;
  };
};

FLOCKING.Boid = function ({ velocity = new Vector(0, 0, 1),
  position = new Vector(10, 0, 0),
  maxSpeed = 1,
  minSeparation = 3,
  maxSeparation = 10,
  mesh = null
} = {}
) {
  let Boid = FLOCKING.Boid;

  if (!(this instanceof Boid)) {
    return new Boid({
      velocity : new Vector(0, 0, 1),
      position : new Vector(10, 0, 0),
      maxSpeed : 1,
      minSeparation : 3,
      maxSeparation : 10,
      mesh : null
    });
  }

  this.mesh = mesh;
  this.forward = velocity.unit();
  this.velocity = velocity;
  this.position = position;
  this.maxSpeed = maxSpeed;
  this.maxAcceleration = 0.1;
  this.minSeparation = minSeparation;
  this.maxSeparation = maxSeparation;
  this.separateNeighbourRadius = 8;
  this.alignNeighbourRadius = 20;
  this.cohereNeighbourRadius = 10;
  this.neighbourRadius = 50;
  this.cohereFactor = 1;
  this.alignFactor = 1;
  this.separateFactor = 1;
  this.radius = 1;
  this.groupId = 0;
  this.mix = 0;
  this.wrap = false;
  this.bound = true;
  this.mix = 0;

  this.heading = new Vector();
  // private
  let acceleration = new Vector(0, 0, 0);
  let neighboursSame = [];
  let neighboursOther = [];

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
    acceleration = acceleration.add(align(neighboursOther).multiply(this.alignFactor * this.mix));
    acceleration = acceleration.add(cohere(neighboursOther).multiply(this.cohereFactor * this.mix));
    // always apply a minimum to avoid collisions
    acceleration = acceleration.add(separate(neighboursOther).multiply(this.separateFactor * (1 + this.mix)));

    acceleration = acceleration.add(align(neighboursSame).multiply(this.alignFactor));
    acceleration = acceleration.add(separate(neighboursSame).multiply(this.separateFactor));
    acceleration = acceleration.add(cohere(neighboursSame).multiply(this.cohereFactor));
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
    // todo - only process boids in front, ignoring boids behind
    for (var i = 0; i < boidCount; i++) {
      boid = boids[i];
      if (this.getId() !== boid.getId()) {
        let d = this.position.subtract(boid.position).length();
        if (d < 30) {
          if (this.groupId === boid.groupId) {
          neighboursSame.push({ d, id: boid.getId(), velocity: boid.velocity, position: boid.position });
          } else {
            neighboursOther.push({ d, id: boid.getId(), velocity: boid.velocity, position: boid.position });
          }
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
      if (neighbours[i].d < this.cohereNeighbourRadius) {
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
    } else {
      result = this.velocity.multiply(2);
    }
    return result;
  };

  let cohere = (neighbours) => {
    let countTooFar = 0;
    let result = new Vector();

    let countLimit = 10;

    for (let i = 0; i < neighbours.length; i++) {
      //if (neighbours[i].d > this.maxSeparation && neighbours[i].d > 0) {
      if (neighbours[i].d < this.alignNeighbourRadius && neighbours[i].d > this.radius) {
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
      if (d < this.separateNeighbourRadius && d > 0) {
        let diff = this.position.subtract(pos).unit().divide(d*d);
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
