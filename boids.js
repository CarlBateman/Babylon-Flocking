// flock
// multiple flocks
// colour code flocks? / filter on colour
// boid

function nearestNeighbour() {
}

var flock = [];
var id = 0;

function makeBoid({ forward = new Vector(0, 0, 1), position = new Vector(10, 0, 0), speed = 1, mesh = null } = {}) {
  let boid = { forward, position, speed, mesh, id: id++ };
  let separationRange = 1;
  let detectionRange = 5;
  let newPosition = new Vector(0, 0, 0);

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
  //   separation: steer to avoid crowding local flockmates
  //   alignment: steer towards the average heading of local flockmates
  //   cohesion: steer to move towards the average position(center of mass) of local flockmates
  var neighbours = [];

  function steer() {
    getNeighbours();
    separate();
    align();
    cohere();
  }

  function separate() {
    let result = new Vector(0, 0, 0);
    for (let i = 0; i < neighbours.length; i++) {
      ;
    }
  }

  function align() {
    let result = new Vector(0, 0, 0);
    for (let i = 0; i < neighbours.length; i++) {
      ;
    }
  }

  function cohere() {
    let result = new Vector(0, 0, 0);
    for (let i = 0; i < neighbours.length; i++) {
      ;
    }
  }


  function getNeighbours() {
    // ignore other boids behind
    for (var i = 0; i < flock.length; i++) {
      if (this.id !== flock[i]) {
        let d = this.position.subtract(flock[i]).length();
        neighbours.push({ d, boid: flock[i] });
      }
    }

    neighbours.filter(function (a) {
      return a.d <= detectionRange;
    });
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