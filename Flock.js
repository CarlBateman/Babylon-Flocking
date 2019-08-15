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
    let lower = this.boids[0].position.clone();
    let upper = this.boids[0].position.clone();

    let bd;

    for (let i = 0; i < this.boids.length; i++) {
      bd = this.boids[i];
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
      this.boids[i].update(dt);
    }
  };

  this.removeBoids = function (numBoids) {
    let start = this.boids.length - numBoids;
    this.boids.splice(start, numBoids);
  };

};

FLOCKING.Boid = function ({ forward_in = new Vector(0, 0, 1),
  position_in = new Vector(10, 0, 0),
  speed_in = 1,
  minSeparation_in = 2,
  maxSeparation_in = 5,
  maxNeighbours_in = 10,
  mesh_in = null
} = {}
) {
  let Boid = FLOCKING.Boid;

  if (!(this instanceof Boid)) {
    return new Boid({
      forward_in : new Vector(0, 0, 1),
      position_in : new Vector(10, 0, 0),
      speed_in : 1,
      minSeparation_in : 2,
      maxSeparation_in : 5,
      maxNeighbours_in : 10,
      mesh_in : null
    });
  }

  this.forward = forward_in;
  this.position = position_in;
  this.speed = speed_in;
  this.mesh = mesh_in;
  this.minSeparation = minSeparation_in;
  this.maxSeparation = maxSeparation_in;
  this.maxNeighbours = maxNeighbours_in;

  this.id = Boid.getNextId();
  // private
  let newForward = new Vector(0, 0, 0);
  let neighbours = [];

  this.update = function (dt) {
    this.position = this.position.add(newForward.multiply(this.speed * dt));
    this.forward = newForward;
  };

  this.steer = function (dt, boids) {
    getNeighbours(boids);
    //let newForward = new Vector(0, 0, 0);
    newForward = this.forward;// new Vector(0, 0, 0);
    newForward = newForward.add(separate());
    newForward = newForward.add(align());
    newForward = newForward.add(cohere());
    newForward = newForward.unit();
  };

  let getNeighbours = function (boids) {
    neighbours = [];
    // todo
    //     only process boids in front, ignoring boids behind
    for (var i = 0; i < boids.length; i++) {
      if (this.id !== boids[i].id) {
        let d = this.position.subtract(boids[i].position).length();
        neighbours.push({ d, id: boids[i].id, forward: boids[i].forward, position: boids[i].position });
      }
    }

    //neighbours.filter(function (a) {
    //  return a.d <= detectionRange;
    //});

    neighbours.sort((a, b) => a.d - b.d);

    //neighbours.sort(compare);

    //function compare(a, b) {
    //  return a.d - b.d;
    //}

    neighbours = neighbours.slice(0, this.maxNeighbours);

  }.bind(this);

  let separate = () => {
    let countTooClose = 0;
    let result = new Vector(0, 0, 0);

    for (let i = 0; i < neighbours.length; i++) {
      //if (neighbours[i].d === 0) {
      //  result = result.add(new Vector(Math.random(), Math.random(), Math.random()));
      //  countTooClose++;
      //}else 
      if (neighbours[i].d <= this.minSeparation) {
        result = result.add(neighbours[i].position.divide(neighbours[i].d));
        countTooClose++;
      }
    }

    if (countTooClose > 0) {
      result = result.divide(countTooClose);
      result = result.subtract(this.position);
      //if (result.length() === 0)
      //  result = forward;
      //else {
      result = result.unit();
      result = result.negative();
      //}
    }
    return result;
  };

  let align = ()=> {
    let result = new Vector(0, 0, 0);// forward;
    for (let i = 0; i < neighbours.length; i++) {
      result = result.add(neighbours[i].forward);
    }

    result = result.unit();
    result = result.add(this.forward);

    if (result.length() === 0) {
      let angles = this.forward.toAngles();
      result = Vector.fromAngles(angles.theta / 2, angles.phi / 2);
    }

    return result;
  }

  let cohere = ()=> {
    let countTooFar = 0;
    let result = new Vector(0, 0, 0);
    for (let i = 0; i < neighbours.length; i++) {
      if (this.position.subtract(neighbours[i]) > this.maxSeparation) {
        result = result.add(neighbours[i].position);
        countTooFar++;
      }
    }
    result = result.divide(countTooFar);
    result = result.subtract(this.position);
    result = result.unit();
    return result;
  }
};

(function () {
  var idx = 0;
  this.getNextId = function () {
    return idx++;
  };
}).call(FLOCKING.Boid);
