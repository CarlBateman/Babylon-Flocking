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
    for (var i = 0; i < this.boids.length; i++) {
      this.boids[i].update(dt, this.boids);
    }
  };

  this.removeBoids = function (numBoids) {
    let start = this.boids.length - numBoids;
    this.boids.splice(start, numBoids);
  };

  //this.removeBoid = function (idx) {
  //  this.boids.splice(start, numBoids);
  //};

  //this.addBoids = addBoids;
  //this.addBoid = addBoid;
  //this.update = update;
  //this.boids = boids;

  //return  addBoids ;
};

//FLOCKING.Flock.prototype.update = function (dt) {
//  for (var i = 0; i < this.boids.length; i++) {
//    ;
//  }
//};


FLOCKING.Boid = function ({ forward = new Vector(0, 0, 1),
                 position = new Vector(10, 0, 0),
                 speed = 1,
                 minSeparation = 2,
                 maxSeparation = 5,
                 maxNeighbours = 10,
                 mesh = null
               } = {}
) {
  let Boid = FLOCKING.Boid;

  if (!(this instanceof Boid)) {
    return new Boid({
      forward: new Vector(0, 0, 1),
      position: new Vector(10, 0, 0),
      speed: 1,
      minSeparation: 2,
      maxSeparation: 5,
      maxNeighbours: 10,
      mesh: null
    });
  }

  this.forward = forward;
  this.position = position;
  this.speed = speed;
  this.mesh = mesh;
  this.minSeparation = 2;
  this.maxSeparation = 5;
  this.maxNeighbours = 10;

  // private
  let id = 0;
  let neighbours = [];

  this.update = function (dt, boids) {
    getNeighbours(boids);
    //let newForward = new Vector(0, 0, 0);
    let newForward = forward;// new Vector(0, 0, 0);
    newForward = newForward.add(separate());
    newForward = newForward.add(align());
    newForward = newForward.add(cohere());
    newForward = newForward.unit();

    this.position = this.position.add(newForward.multiply(speed * dt));
    this.forward = newForward;
  };

  let getNeighbours = function (boids) {
    neighbours = [];
    // todo
    //     only process boids in front
    //     ignore other boids behind
    for (var i = 0; i < boids.length; i++) {
      if (id !== boids[i].id) {
        let d = position.subtract(boids[i].position).length();
        neighbours.push({ d, id: boids[i].id, forward: boids[i].forward, position: boids[i].position });
      }
    }

    neighbours.sort(compare);

    function compare(a, b) {
      return a.d - b.d;
    }

    neighbours = neighbours.slice(0, maxNeighbours);

  };

  function separate() { }
  function align() { }
  function cohere() { }


  //this.update = update;
  //return this;

  //return {update, position, forward};
}

//FLOCKING.Boid.prototype = {
//  separate: function () { },

//  align: function () { },

//  cohere: function () { },

//  getNeighbours: function () { },
//};



//var Gadget = (function () {
//  // static variable/property
//  var counter = 0,
//    NewGadget;
//  // this will become the
//  // new constructor implementation
//  NewGadget = function () {
//    counter += 1;
//  };
//  // a privileged method
//  NewGadget.prototype.getLastId = function () {
//    return counter;
//  };
//  // overwrite the constructor
//  return NewGadget;
//}());

//var g = new Gadget();

//(function () {
//  var id = 0;

//  this.next = function () {
//    return id++;
//  };

//  this.reset = function () {
//    id = 0;
//  };
//}).apply(FLOCKING);


//(function () {
//  this.Block = function () { return {} };
//}).apply(FLOCKING);
////FLOCKING.Block = function () { return {}; };
