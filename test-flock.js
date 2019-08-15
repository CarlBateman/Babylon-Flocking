// test flock
window.addEventListener('DOMContentLoaded', function () {
  let boid2 = new FLOCKING.Boid();
  //boid2.update(1);

  boid2.minSeparation = 2;

  let flock1 = new FLOCKING.Flock(1);
  //console.log(1, flock1.boids);

  flock1.addBoids(1);
  //console.log(2,flock1.boids);

  flock1.addBoids([FLOCKING.Boid()]);
  //console.log(3, flock1.boids);

  flock1.addBoids([FLOCKING.Boid()]);
  //console.log(4,flock1.boids);

  flock1.addBoid(FLOCKING.Boid());
  //console.log(5,flock1.boids);

  flock1.addBoid();
  //console.log(6,flock1.boids);

  //console.log(flock1.boids[1]);
  //console.log(flock1.boids[1].forward);
  //console.log(flock1.boids[1].position);

  
  console.log(flock1.boids.length, flock1.boids);
  flock1.removeBoids(2);
  console.log(flock1.boids.length, flock1.boids);

  flock1.update(1);

  //console.log(flock1.boids);


});
