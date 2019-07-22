// flock
// boid
function makeBoid({ forward = new Vector(0, 0, 1), position = new Vector(10, 0, 0), speed = 1, mesh = null } = {}) {

  let boid = { forward, position, speed, mesh };

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


  return boid;
}