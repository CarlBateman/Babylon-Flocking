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
  this.bounds = { lower: new Vector(), upper: new Vector(), centre: new Vector() };

  let Boid = FLOCKING.Boid;

  this.addBoid = function (nboid) {
    if (nboid instanceof Boid) {
      this.boids.push(nboid);
    } else {
      this.boids.push(Boid());
    }
  };

  this.addBoids = function (nboids = 1) {
    if (Array.isArray(nboids)) {
      this.boids = this.boids.concat(nboids);
    } else
      for (var i = 0; i < nboids; i++) {
        this.boids.push(Boid());
      }
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

    for (let i = 0; i < this.boids.length; i++) {
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

      bd.steer(dt, this.boids);
    }

    this.bounds.upper = upper;
    this.bounds.lower = lower;
    this.bounds.centre = upper.add(lower).divide(2);

    for (let i = 0; i < this.boids.length; i++) {
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

  this.forward = velocity.unit();
  this.velocity = velocity;
  this.position = position;
  this.maxSpeed = maxSpeed;// * 1.5;
  this.maxAcceleration = 0.1;
  this.mesh = mesh;
  this.minSeparation = minSeparation;
  this.maxSeparation = maxSeparation;
  this.neighbourRadius = 50;
  this.cohereFactor = 1;
  this.alignFactor = 1;
  this.seperateFactor = 1;
  this.radius = 1;

  this.heading = new Vector();
  // private
  let acceleration = new Vector(0, 0, 0);
  let neighbours = [];

  this.getId = ((id) => {
    return () => id;
  })(Boid.getNextId());

  this.update = function (dt) {
    // weight
    // limits
    // targets
    // obstacles
    // racism

    // lonely (boid has no neighbours)
    // boundary

    // dat gui

    let pos = this.position;
    if (false) {
      if (pos.x > 50) acceleration.x = -Math.abs(acceleration.x);
      if (pos.x < -50) acceleration.x = Math.abs(acceleration.x);
      if (pos.z > 50) acceleration.z = -Math.abs(acceleration.z);
      if (pos.z < -50) acceleration.z = Math.abs(acceleration.z);
      acceleration.limit(1);
    } else {
      if (pos.x > 50) pos.x -= 100;
      if (pos.x < -50) pos.x += 100;
      if (pos.z > 50) pos.z -= 100;
      if (pos.z < -50) pos.z += 100;
    }

    // Update using Euler method
    this.velocity = this.velocity.add(acceleration.multiply(dt)).limit(1);
    this.position = this.position.add(this.velocity.multiply(dt));
    this.heading = this.velocity;

  };

  this.steer = function (dt, boids) {
    getNeighbours(boids);
    //acceleration = this.velocity.multiply(this.maxSpeed);
    acceleration.zero();
    acceleration = acceleration.add(align());
    acceleration = acceleration.add(separate());
    acceleration = acceleration.add(cohere());
    acceleration = acceleration.limit(this.maxAcceleration);
    //acceleration = acceleration.add(this.velocity.multiply(this.maxSpeed * dt));
    //acceleration = acceleration.unit();
  };

  let getNeighbours = (boids) => {
    neighbours = [];
    // todo - only process boids in front, ignoring boids behind
    for (var i = 0; i < boids.length; i++) {
      if (this.getId() !== boids[i].getId()) {
        let d = this.position.subtract(boids[i].position).length();
        if (d < 30)
        neighbours.push({ d, id: boids[i].getId(), velocity: boids[i].velocity, position: boids[i].position });
      }
    }
    neighbours.sort((a,b) => a.d - b.d);

  };

  let align = () => {
    let countAligned = 0;
    let result = new Vector();
    for (let i = 0; i < neighbours.length; i++) {
      if (neighbours[i].d < 10) {
        result = result.add(neighbours[i].velocity);
        countAligned++;
      }
    }

    if (countAligned > 0) {
      result = result.divide(countAligned);
      result = result.setMag(this.maxSpeed);
      // steering force
      result = result.subtract(this.velocity);
      result = result.limit(this.maxSpeed);
    }
    return result;
  };

  let cohere = () => {
    let countTooFar = 0;
    let result = new Vector();
    for (let i = 0; i < neighbours.length; i++) {
      //if (neighbours[i].d > this.maxSeparation && neighbours[i].d > 0) {
      if (neighbours[i].d < 20) {
        result = result.add(neighbours[i].position);
        countTooFar++;
      }
    }
    if (countTooFar > 0) {
      result = result.divide(countTooFar);
      // result is absolute
      // make relative to this boid
      result = result.subtract(this.position);
      result = result.setMag(this.maxSpeed);
      // steering force
      result = result.subtract(this.velocity);
      result = result.limit(this.maxSpeed);
    }
    return result;
  };

  let separate = () => {
    let countTooClose = 0;
    let result = new Vector();

    for (let i = 0; i < neighbours.length; i++) {
      let d = neighbours[i].d;
      let pos = neighbours[i].position;
      if (d < 8 && d>0) {
        let diff = this.position.subtract(pos).divide(d).unit();
        result = result.add(diff);
        countTooClose++;
      }
    }
    if (countTooClose > 0) {
      result = result.divide(countTooClose);
      // direction to centre should be relative from current position
      result = result.setMag(this.maxSpeed);
      result = result.subtract(this.velocity);
      result = result.limit(this.maxSpeed);
      //result = result.negative();
    }
    return result;
  };
};

(function () {
  var idx = 0;
  this.getNextId = function () {
    return idx++;
  };
}).call(FLOCKING.Boid);
