// relies vector.js

function Flock(numBoids = 0) {
  let boids = [];

  if (this instanceof Flock) {
    addBoids(numBoids);
  } else {
    return new Flock(numBoids);
  }


  //function addBoids(numBoids = 1) {
  //  for (var i = 0; i < numBoids; i++) {
  //    boids.push(Boid);
  //  }
  //}
}

//Flock.addBoids = function () {
//};

function Boid( { forward = new Vector(0, 0, 1),
                 position = new Vector(10, 0, 0),
                 speed = 1,
                 minSeparation = 2,
                 maxSeparation = 5,
                 maxNeighbours = 10,
                 mesh = null
               } = {}
             ) {

  if (this instanceof Boid) {
    this.forward = forward;
    this.position = position;
    this.speed = speed;
    this.mesh = mesh;
    this.minSeparation = 2;
    this.maxSeparation = 5;
    this.maxNeighbours = 10;
  } else {
    return new Boid( { forward: new Vector(0, 0, 1),
                       position: new Vector(10, 0, 0),
                       speed: 1,
                       minSeparation: 2,
                       maxSeparation: 5,
                       maxNeighbours: 10,
                       mesh: null
                     } );
  }

  // private
  let id = 0;
  let newForward = new Vector(0, 0, 0);
  let neighbours = [];

  let getNeighbours = function (boids) {
    neighbours = [];
    // todo
    //     only process boids in front
    //     ignore other boids behind
    for (var i = 0; i < boids.length; i++) {
      if (self.id !== boids[i].id) {
        let d = self.position.subtract(boids[i].position).length();
        neighbours.push({ d, id: boids[i].id, forward: boids[i].forward, position: boids[i].position });
      }
    }

    neighbours.sort(compare);

    function compare(a, b) {
      return a.d - b.d;
    }

    neighbours = neighbours.slice(0, maxNeighbours);
  };

  function update(dt = 0.1) {
    this.position = this.position.add(newForward.multiply(speed * dt));
    this.forward = newForward;
  }

  function steer () {
    getNeighbours(boids);
    newForward = this.forward;// new Vector(0, 0, 0);
    newForward = newForward.add(separate());
    newForward = newForward.add(align());
    newForward = newForward.add(cohere());
    newForward = newForward.unit();
  }

}

Boid.prototype = {
  separate: function () { },

  align: function () { },

  cohere: function () { },

  getNeighbours: function () { },

  addBoids: function (numBoids = 1) {
    for (var i = 0; i < numBoids; i++) {
      boids.push(Boid);
    }
  }
};