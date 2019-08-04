// multiple flocks
// colour code flocks? / filter on colour

// flock
// boid
// find neighbours
// hash
// move
// steer
//   separation: steer to avoid crowding local flockmates
//   alignment: steer towards the average heading of local flockmates
//   cohesion: steer to move towards the average position(center of mass) of local flockmates
// avoid objects
// follow leader


function nearestNeighbour() {
}

var id = 0;

function makeFlock() {
  let boids = [];

  function update(dt) {
    for (let i = 0; i < boids.length; i++) {
      boids[i].steer(boids);
    }
    for (let i = 0; i < boids.length; i++) {
      boids[i].update(dt);
    }
  }

  function add(boid) {
    boids.push(boid);
  }

  return { update, add, boids };
}

function makeBoid({ forward = new Vector(0, 0, 1), position = new Vector(10, 0, 0), speed = 1, mesh = null } = {}) {
  let boid = { forward, position, speed, mesh, id: id++, steer, update };
  let minSeparation = 2;
  let maxSeparation = 5;
  let maxNeighbours = 10;
  let newForward = new Vector(0, 0, 0);
  let self = boid;

  // move around some point
  function rotateAbout(origin, dt, distance) {
    // get the distance from the origin
    let d = distance || this.position.subtract(origin).length();

    // move forward
    let fwd = this.forward.multiply(dt * this.speed);
    let p = this.position.add(fwd);

    // normalise the new positon relative to the origin 
    p = p.subtract(origin);
    p = p.unit();
    p = p.multiply(d);

    // derive the new forward (new pos - old pos)
    this.forward = p.subtract(this.position);
    this.forward = this.forward.unit();
    this.position = p;
  }
  boid.rotateAbout = rotateAbout;

  // steer
  //   separation: steer to avoid crowding local flockmates (short range repulsion)
  //   alignment: steer towards the average heading of local flockmates
  //   cohesion: steer to move towards the average position (center of mass) of local flockmates (long range attraction)
  var neighbours = [];

  function steer(boids) {
    getNeighbours(boids);
    newForward = this.forward;// new Vector(0, 0, 0);
    newForward = newForward.add(separate());
    newForward = newForward.add(align());
    newForward = newForward.add(cohere());
    newForward = newForward.unit();
  }

  function update(dt) {
    this.position = this.position.add(newForward.multiply(speed * dt));
    this.forward = newForward;
  }

  function separate() {
    let countTooClose = 0;
    let result = new Vector(0, 0, 0);

    for (let i = 0; i < neighbours.length; i++) {
      //if (neighbours[i].d === 0) {
      //  result = result.add(new Vector(Math.random(), Math.random(), Math.random()));
      //  countTooClose++;
      //}else 
      if (neighbours[i].d <= minSeparation) {
        result = result.add(neighbours[i].position.divide(neighbours[i].d));
        countTooClose++;
      }
    }

    if (countTooClose > 0) {
      result = result.divide(countTooClose);
      result = result.subtract(self.position);
      //if (result.length() === 0)
      //  result = self.forward;
      //else {
        result = result.unit();
        result = result.negative();
      //}
    }

    return result;
  }

  function align() {
    let result = new Vector(0, 0, 0);// self.forward;
    for (let i = 0; i < neighbours.length; i++) {
      result = result.add(neighbours[i].forward);
    }

    result = result.unit();
    result = result.add(self.forward);

    if (result.length() === 0) {
      let angles = self.forward.toAngles();
      result = Vector.fromAngles(angles.theta / 2, angles.phi / 2);
    }

    return result;
  }

  function cohere() {
    let countTooFar = 0;
    let result = new Vector(0, 0, 0);
    for (let i = 0; i < neighbours.length; i++) {
      if (self.position.subtract(neighbours[i]) > maxSeparation) {
      result = result.add(neighbours[i].position);
        countTooFar++;
      }
    }
    result = result.divide(countTooFar);
    result = result.subtract(self.position);
    result = result.unit();
    return result;
  }


  function getNeighbours(boids) {
    neighbours = [];
    // ignore other boids behind
    for (var i = 0; i < boids.length; i++) {
      if (self.id !== boids[i].id) {
        let d = self.position.subtract(boids[i].position).length();
        neighbours.push({ d, id: boids[i].id, forward: boids[i].forward, position: boids[i].position });
      }
    }

    //neighbours.filter(function (a) {
    //  return a.d <= detectionRange;
    //});
    neighbours.sort(compare);

    function compare(a, b) {
      if (a.d > b.d) return 1;
      if (a.d < b.d) return -1;
      return 0;
      // return a.d - b.d;
    }

    neighbours = neighbours.slice(0, maxNeighbours);
  }

  return boid;
}