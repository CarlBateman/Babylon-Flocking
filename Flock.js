// relies on vector.js
var FLOCKING = FLOCKING || (function () {
  return {};
})();

FLOCKING.Flock = function (numBoids = 0) {
  let Flock = FLOCKING.Flock;
  if (this instanceof Flock) {
    //console.log("2",this);
    //return Flock(numBoids).call(Flock);
  } else {
    //console.log("1",this);
    return new Flock(numBoids);
  }

  let boids = [];

  let Boid = FLOCKING.Boid;

  // private
  let addBoids1 = function (numBoids = 1) {
    for (var i = 0; i < numBoids; i++) {
      boids.push(Boid);
    }
  };
  addBoids1(numBoids);

  // private
  function addBoids2(numBoids = 1) {
    for (var i = 0; i < numBoids; i++) {
      boids.push(Boid);
    }
  }
  addBoids2(numBoids);




  let fn = function () { };
  fn.addBoids_fn = function (numBoids = 1) {
    addBoids1(numBoids); // <- OK
    addBoids2(numBoids); // <- OK
    //addBoids_this(numBoids); // <- BAD
    //ob.addBoids_ob(numBoids); // <- OK order
    //this.addBoids_this(numBoids); // <- BAD
    for (var i = 0; i < numBoids; i++) {
      boids.push(Boid);
    }
  };
  fn.addBoids_fn(numBoids);



  let ob = {};
  // exposed (public or privileged?)
  ob.addBoids_ob = function (numBoids = 1) {
    addBoids1(numBoids); // <- OK
    addBoids2(numBoids); // <- OK
    //addBoids_this(numBoids); // <- BAD
    //fn.addBoids_fn(numBoids); // <- OK order
    //this.addBoids_this(numBoids); // <- BAD
    for (var i = 0; i < numBoids; i++) {
      boids.push(Boid);
    }
  };
  ob.addBoids_ob(numBoids);

  // public IF return this
  this.addBoids_this = function (numBoids = 1) {
    addBoids1(numBoids); // <- OK
    addBoids2(numBoids); // <- OK
    ob.addBoids_ob(numBoids); // <- OK order
    fn.addBoids_fn(numBoids); // <- OK order
    for (var i = 0; i < numBoids; i++) {
      boids.push(Boid);
    }
  };
  this.addBoids_this(numBoids);




  return this;
};

FLOCKING.Flock.prototype.addBoids12 = function (numBoids) {
  for (var i = 0; i < numBoids; i++) {
    boids.push(Boid);
  }
};

FLOCKING.Flock.addBoids13 = function () {
  for (var i = 0; i < numBoids; i++) {
    boids.push(Boid);
  }
};


FLOCKING.Flock.prototype.test1 = function () {
  console.log(this);
  //this.test2();
  FLOCKING.Flock.test2();
};

FLOCKING.Flock.test2 = function () {
  let a;
  console.log(this);
};

//Flock.prototype = {};

//Flock.addBoids = function (numBoids = 1) {
//  for (var i = 0; i < numBoids; i++) {
//    this.boids.push(Boid);
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

FLOCKING.Boid.prototype = {
  separate: function () { },

  align: function () { },

  cohere: function () { },

  getNeighbours: function () { },


};



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
