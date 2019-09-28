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
  this.numberOfNeighbours = 10;

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

    // groups!!!
    let octrees = [];
    for (var i = 0; i < 3; i++) {
      octrees[i] = new Octree(new Vec3(-110, -110, -110), new Vec3(220, 220, 220));
    }

    for (let i = 0; i < this.boidCount; i++) {
      let bd = this.boids[i];
      let t = bd.position.toArray(3);
      let v = new Vec3(...t);
      octrees[bd.groupId].add(v, i);

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

    let res = [];
    for (let i = 0; i < this.boidCount; i++) {
      bd = this.boids[i];


      /////////////////////////////////////////////////
      // this should be a function
      let radius = 2;
      let happy = false;

      while (!happy) {
        res[bd.groupId] = octrees[bd.groupId].findNearbyPoints(new Vec3(...bd.position.toArray(3)), radius, { notSelf: true, includeData: true });

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
          res[j] = octrees[j].findNearbyPoints(new Vec3(...bd.position.toArray(3)), radius, { notSelf: true, includeData: true });
        }
      }
      // this should be a function
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
  this.numNeighbours = 8;
  this.separateNeighbourRadius = 8;
  this.alignNeighbourRadius = 20;
  this.cohereNeighbourRadius = 10;
  this.cohereStrength = 1;
  this.alignStrength = 1;
  this.separateStrength = 1;
  this.radius = 1;
  this.groupId = 0;
  this.mix = 0;
  this.wrap = true;
  this.bound = false;
  this.hidden = false;
  this.separateNumberOfNeighbours = 10;
  this.alignNumberOfNeighbours = 10;
  this.cohereNumberOfNeighbours = 10;

  this.heading = new Vector();
  // private
  let acceleration = new Vector(0, 0, 0);
  let neighboursSame = [];
  let neighboursOther = [];
  let separateNeighbourRadiusSq;
  let alignNeighbourRadiusSq;
  let cohereNeighbourRadiusSq;

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
    this.heading = this.velocity.unit();
  };

  this.steer = function (dt, boids, boidCount, limits) {
    getNeighbours(boids, boidCount);
    acceleration.zero();
    //acceleration = acceleration.add(wiggle().multiply(dt));
    acceleration = acceleration.add(align(neighboursOther).multiply(this.alignStrength * this.mix));
    acceleration = acceleration.add(cohere(neighboursOther).multiply(this.cohereStrength * this.mix));
    // always apply a minimum to avoid collisions
    acceleration = acceleration.add(separate(neighboursOther).multiply(this.separateStrength));
    //acceleration = acceleration.add(separate(neighboursOther).multiply(this.separateStrength * (1 + this.mix)));

    acceleration = acceleration.add(align(neighboursSame).multiply(this.alignStrength));
    acceleration = acceleration.add(separate(neighboursSame).multiply(this.separateStrength));
    acceleration = acceleration.add(cohere(neighboursSame).multiply(this.cohereStrength));

    //acceleration = acceleration.add(clump(neighboursOther));
    //acceleration = acceleration.add(clump(neighboursSame));

    acceleration = acceleration.limit(this.maxAcceleration);
    if (this.bound)
      acceleration = acceleration.add(limit(limits).multiply(.1));
    if (this.wrap)
      wrap(limits);
  };

  let getNeighbours_OLD = (boids, boidCount) => {
    neighboursSame = [];
    neighboursOther = [];
    let boid;

    let radiusSq = this.radius * this.radius;

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

      let relativePosition = this.position.subtract(boid.position);

      // todo - only process boids in front, ignoring boids behind
      if (this.position.angleTo(boid.position) > Math.PI/2)
        continue;

      let d = relativePosition.lengthSq();

      if (this.groupId === boid.groupId) {
        neighboursSame.push({ d, id: boid.getId(), velocity: boid.velocity, position: boid.position });
      } else {
        neighboursOther.push({ d, id: boid.getId(), velocity: boid.velocity, position: boid.position });
      }
    }
    neighboursSame.sort((a, b) => a.d - b.d);
    neighboursOther.sort((a, b) => a.d - b.d);
  };

  let clump = (neighbours) => {
    let countTooFar = 0;
    let result = new Vector(0, 0, 0);
    //for (let i = 0; i < neighbours.length; i++) {
    //  if (self.position.subtract(neighbours[i]) > maxSeparation) {
    //    result = result.add(neighbours[i].position);
    //    countTooFar++;
    //  }
    //}
    //result = result.divide(countTooFar);
    result = result.subtract(this.position);
    result = result.unit();
    return result;
  };

  let align = (neighbours) => {
    let countAligned = 0;
    let result = new Vector();

    for (let i = 0; i < neighbours.length; i++) {
      if (neighbours[i].d < alignNeighbourRadiusSq) {
        result = result.add(neighbours[i].velocity);
        countAligned++;
      }
      if (countAligned > this.numberOfNeighbours) {
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

    let radiusSq = this.radius * this.radius * 2;

    for (let i = 0; i < neighbours.length; i++) {
      if (neighbours[i].d < cohereNeighbourRadiusSq && neighbours[i].d > radiusSq) {
        result = result.add(neighbours[i].position);
        countTooFar++;
      }
      if (countTooFar > this.numberOfNeighbours) {
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

    for (let i = 0; i < neighbours.length; i++) {
      let d = neighbours[i].d;
      let pos = neighbours[i].position;
      if (d < separateNeighbourRadiusSq && d > 0) {
        //let diff = this.position.subtract(pos).unit().divide(d);
        let diff = this.position.subtract(pos).divide(d);
        result = result.add(diff);
        countTooClose++;
      }
      if (countTooClose > this.numberOfNeighbours) {
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

  let wiggle = () => {
    // generate point along normal to velocity
    let x = Math.random() - .5;
    let y = Math.random() - .5;
    let z = Math.random() - .5;
    let v = new Vector(x, y, z);
    v = v.multiply(this.velocity).unit();
    return this.velocity.unit().multiply(10).add(v).limit(this.maxAcceleration);
  };

  let repelLimit = ()=> {
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
