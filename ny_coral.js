let land;
let landR = 150;
let landX = 250;
let landY = 250;
let seaFloorLevel = 750;

let seafloor;
let numDrivers = 200;
let drivers = [];
let entities = [];

function setup(){
	createCanvas(500,800);
	land = new LandCircle(landX,landY,landR,0,0.25);
	seafloor = new SeaFloor(seaFloorLevel,500,800);

	for(i=0; i<numDrivers; i++){
		let r = random(0,landR-10);
		let theta = random(0, 2*PI);
		drivers.push(new Driver(r*cos(theta)+landX, 
								r*sin(theta)+landY,
								8,
								seaFloorLevel,seaFloorLevel,
								land));
	}

	entities = concat([land, seafloor], drivers);
}

function draw(){
	background('white');
//	background(0,0,244,70);
	entities.forEach((e) => {
		e.update();
		e.draw();
	})
}

class SeaFloor {
	constructor(y, xMax, yMax){
		this.y = y;
		this.xMax = xMax;
		this.yMax = yMax;
	}

	draw(){
		push();
		fill('grey');
		rect(0,this.y, this.xMax, this.yMax);
		pop();
	}

	update(){}
}

class LandCircle {
	constructor(x,y,maxR, minR, deltaR){
		this.x = x;
		this.y = y;
		this.center = createVector(this.x, this.y);
		this.r = maxR;
		this.minR = minR;
		this.deltaR = deltaR;
	}

	update(){
		this.r = this.r - this.deltaR;
		if(this.r <= this.minR){
			this.r=this.minR;
		}

	}

	draw(){
		push();
		noStroke();
		fill(80,80);
		circle(this.x, this.y, this.r*2);
		pop();

	}

	contains(xyPos){
		let dist = p5.Vector.sub(xyPos, this.center).mag();
		if(dist < this.r){
			return true;
		} else{
			return false;
		}

	}

	getCenter(){
		return this.center.copy();
	}

}


class Driver {

	constructor(xInit, yInit, size, xMax, yMax, landObj){
		this.pos = createVector(xInit, yInit);
		this.size = size;
		this.velocity = createVector(0,0);

		this.xMax = xMax;
		this.yMax = yMax;

		this.land = landObj;

		this.everOutside = false;
		this.ticker = 0;
		this.firstOutside = null;

		this.isCoral = false; // is this part of a coral? 
	}

	applyForce(vec){
		console.log(this.velocity);
		this.velocity.add(vec);
		this.velocity.x = constrain(this.velocity.x, -5,5);
		this.velocity.y = constrain(this.velocity.y, -5,5);
	}

	computeFirstForce(){
		return p5.Vector.sub(this.pos, this.land.getCenter()).normalize().mult(6);
	}

	computeWaterResistanceForce(){
		return this.velocity.copy().mult(-1).mult(0.2);
	}

	computeGravityForce(){ // gravity and random left/right
		return createVector(
				map(noise(this.pos.x, this.pos.y),0,1,-0.3,0.3),
				0.25
			);
	}

	update(){
		if(!this.land.contains(this.pos)){ // off the land
			
			if(!this.everOutside){ // this is first time outside
				this.applyForce(this.computeFirstForce());
				this.everOutside = true;
				this.isStatic = false;
				this.firstOutside = this.ticker;
			}

			this.applyForce(this.computeGravityForce());
			this.applyForce(this.computeWaterResistanceForce());

		}

		this.pos.add(this.velocity);
		this.applyPosBoundaries();
		this.ticker = this.ticker + 1;
	}

	applyPosBoundaries(){
		if(this.pos.x > this.xMax){
			this.pos.x = this.xMax;
		}
		if(this.pos.y > this.yMax){
			this.pos.y = this.yMax;
		}
		if(this.pos.x < 0){
			this.pos.x = 0;
		}
		if(this.pos.y < 0){
			this.pos.y = 0;
		}
	}

	draw(){
		push();
		noStroke();
		fill(25,80);
		if(this.everOutside){
			fill(0,constrain(this.firstOutside*1.1,50,150),40,80);
		}
		circle(this.pos.x, this.pos.y, this.size);
		pop();
	}


}