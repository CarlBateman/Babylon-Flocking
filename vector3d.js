// simplified 3D vector
function makeVec3(x, y, z) {
  return {
    x: x || 0.0, y: y || 0.0, z: z || 0.0,

  function : diff(v) {
    return { this.x - v.x, this.y - v.y, this.z - v.z };
  };
};}

// functions
// scale
// add
// subtract
// normalise
// size, magnitude, length

function Vector3D() {
  function diff(v1, v2) {
    return makeVec3(v1.x - v2.x, v1.y - v2.y, v1.z - v2.z);
  }

  function sqr(v1) {
    return makeVec3(v1.x * v1.x, v1.y * v1.y, v1.z * v1.z);
  }
}

