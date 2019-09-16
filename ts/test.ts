let cnv = new CNV.Canvas()

// Reference https://p5js.org/examples/simulate-flocking.html
function sketch() {
  var flock = new Flock()

  function init() {
    cnv.init('test', 640, 360)
    // Add an initial set of boids into the system
    for (let i = 0; i < 100; i++) {
      let b = new Boid(cnv.width / 2, cnv.height / 2)
      flock.addBoid(b)
    }
  }

  function draw() {
    cnv.setBackground(51)
    flock.run()
    // cnv.fill(255)
    // cnv.push()
    // cnv.scale(1 * Math.sin(cnv.time.now * 0.001), 1 * Math.sin(cnv.time.now * 0.001))
    // cnv.rotate((cnv.time.frameCount * 5 % 360) / 360)
    // cnv.push()
    // cnv.translate(100, 100)
    // // cnv.rect(0, 0, 50, 50)
    
    // cnv.beginShape()
    // cnv.vertex(0, 0);
    // cnv.vertex(0, 100);
    // cnv.vertex(100, 0);
    // cnv.endShape(true)
    // // cnv.rect(0, 0, 50, 50)

    // cnv.push()
    // cnv.translate(100, 100)
    // // cnv.rect(0, 0, 50, 50)

    // cnv.beginShape()
    // cnv.vertex(0, 0);
    // cnv.vertex(0, 100);
    // cnv.vertex(100, 0);
    // cnv.endShape(true)

    // cnv.pop()
    // cnv.pop()
    // cnv.pop()
  }
  init()
  cnv.setDrawCallback(draw)
  cnv.drawLoop()
}

class Flock {
  boids: Boid[]
  constructor() {
    this.boids = []
  }
  run() {
    for (let i = 0; i < this.boids.length; i++) {
      this.boids[i].run(this.boids)
    }
  }
  addBoid(b: Boid) {
    this.boids.push(b);
  }
}

class Boid {
  acceleration: CNV.Vec
  velocity: CNV.Vec
  position: CNV.Vec
  r: number
  maxspeed: number
  maxforce: number

  constructor(x: number, y: number) {
    this.acceleration = CNV.vec(0, 0)
    this.velocity = CNV.vec(CNV.nrand(-1, 1), CNV.nrand(-1, 1));
    this.position = CNV.vec(x, y);
    this.r = 3.0;
    this.maxspeed = 3; // Maximum speed
    this.maxforce = 0.05; // Maximum steering force
  }

  run(boids: Boid[]) {
    this.flock(boids);
    this.update();
    this.borders();
    this.render();
  }

  applyForce(force: CNV.Vec) {
    // We could add mass here if we want A = F / M
    this.acceleration.add(force);
  }

  // We accumulate a new acceleration each time based on three rules
  flock(boids: Boid[]) {
    let sep = this.separate(boids); // Separation
    let ali = this.align(boids); // Alignment
    let coh = this.cohesion(boids); // Cohesion

    // Arbitrarily weight these forces
    sep.mult(1.5);
    ali.mult(1.0);
    coh.mult(1.0);

    // Add the force vectors to acceleration
    this.applyForce(sep);
    this.applyForce(ali);
    this.applyForce(coh);
  }

  // Method to update location
  update() {
    // Update velocity
    this.velocity.add(this.acceleration);
    // Limit speed
    this.velocity.limit(this.maxspeed);
    this.position.add(this.velocity);
    // Reset accelertion to 0 each cycle
    this.acceleration.mult(0);
  }

  // A method that calculates and applies a steering force towards a target
  // STEER = DESIRED MINUS VELOCITY
  seek(target: CNV.Vec) {
    let desired: CNV.Vec = CNV.Vec.sub(target, this.position); // A vector pointing from the location to the target
    // Normalize desired and scale to maximum speed
    desired.normalize();
    desired.mult(this.maxspeed);
    // Steering = Desired minus Velocity
    let steer = CNV.Vec.sub(desired, this.velocity);
    steer.limit(this.maxforce); // Limit to maximum steering force
    return steer;
  }

  render() {
    // Draw a triangle rotated in the direction of velocity
    let theta = this.velocity.heading + CNV.radians(90);
    cnv.fill(127);
    cnv.stroke(200);
    cnv.push();
    cnv.translate(this.position.x, this.position.y);
    // cnv.rotate(CNV.degrees(theta));
    cnv.beginShape()
    cnv.vertex(0, -this.r * 2);
    cnv.vertex(-this.r, this.r * 2);
    cnv.vertex(this.r, this.r * 2);
    cnv.endShape(true)
    cnv.pop();
  }
  // Wraparound
  borders() {
    if (this.position.x < -this.r)
      this.position.x = cnv.width + this.r;
    if (this.position.y < -this.r)
      this.position.y = cnv.height + this.r;
    if (this.position.x > cnv.width + this.r)
      this.position.x = -this.r;
    if (this.position.y > cnv.height + this.r)
      this.position.y = -this.r;
  }
  // Separation
  // Method checks for nearby boids and steers away
  separate(boids: Boid[]) {
    let desiredseparation = 25.0;
    let steer = CNV.vec(0, 0);
    let count = 0;
    // For every boid in the system, check if it's too close
    for (let i = 0; i < boids.length; i++) {
      let d = CNV.Vec.dist(this.position, boids[i].position);
      // If the distance is greater than 0 and less than an arbitrary amount (0 when you are yourself)
      if ((d > 0) && (d < desiredseparation)) {
        // Calculate vector pointing away from neighbor
        let diff = CNV.Vec.sub(this.position, boids[i].position);
        diff.normalize();
        diff.div(d); // Weight by distance
        steer.add(diff);
        count++; // Keep track of how many
      }
    }
    // Average -- divide by how many
    if (count > 0) {
      steer.div(count);
    }
    // As long as the vector is greater than 0
    if (steer.mag > 0) {
      // Implement Reynolds: Steering = Desired - Velocity
      steer.normalize();
      steer.mult(this.maxspeed);
      steer.sub(this.velocity);
      steer.limit(this.maxforce);
    }
    return steer;
  }
  // Alignment
  // For every nearby boid in the system, calculate the average velocity
  align(boids: Boid[]) {
    let neighbordist = 50;
    let sum = CNV.vec(0, 0);
    let count = 0;
    for (let i = 0; i < boids.length; i++) {
      let d = CNV.Vec.dist(this.position, boids[i].position);
      if ((d > 0) && (d < neighbordist)) {
        sum.add(boids[i].velocity);
        count++;
      }
    }
    if (count > 0) {
      sum.div(count);
      sum.normalize();
      sum.mult(this.maxspeed);
      let steer = CNV.Vec.sub(sum, this.velocity);
      steer.limit(this.maxforce);
      return steer;
    }
    else {
      return CNV.vec(0, 0);
    }
  }
  // Cohesion
  // For the average location (i.e. center) of all nearby boids, calculate steering vector towards that location
  cohesion(boids: Boid[]) {
    let neighbordist = 50;
    let sum = CNV.vec(0, 0); // Start with empty vector to accumulate all locations
    let count = 0;
    for (let i = 0; i < boids.length; i++) {
      let d = CNV.Vec.dist(this.position, boids[i].position);
      if ((d > 0) && (d < neighbordist)) {
        sum.add(boids[i].position); // Add location
        count++;
      }
    }
    if (count > 0) {
      sum.div(count);
      return this.seek(sum); // Steer towards the location
    }
    else {
      return CNV.vec(0, 0);
    }
  }
}

sketch()
