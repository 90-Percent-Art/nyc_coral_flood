let canvasX = 500;
let canvasY = 800;

let land;
let landR = 150;
let landX = 250;
let landY = 250;
let seaFloorLevel = 750;

let seafloor;
let numDrivers = 300;
let drivers = [];
let entities = [];

let colorOptions = ['#8D5524', '#C68642', '#E0AC69', '#F1C27D', '#FFDBAC'];

function setup(){
	createCanvas(canvasX,canvasY);
	land = new LandCircle(landX,landY,landR,0,0.25);
	seafloor = new SeaFloor(seaFloorLevel,canvasX,canvasY);

	for(i=0; i<numDrivers; i++){
		let r = random(0,landR-10);
		let theta = random(0, 2*PI);
		drivers.push(new Driver(r*cos(theta)+landX, 
								r*sin(theta)+landY,
								8,
								canvasX,
								seaFloorLevel,
								land));
	}

	entities = concat([land, seafloor], drivers);
}

function draw(){
	background('#91B8C4'); //78B2C4
	entities.forEach((e) => {
		e.update();
		e.draw();
	})

	push();
	fill('black');
	circle(mouseX, mouseY, 20);
	pop();
}

class SeaFloor {
	constructor(y, xMax, yMax){
		this.y = y;
		this.xMax = xMax;
		this.yMax = yMax;
	}

	draw(){
		push();
		noStroke();
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

		this.state = 'CITY'; // CITY, FALL, CORAL
		this.color = random(colorOptions);

	}

	applyForce(vec){
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

	computeMouseForce(){
		if(mouseX > 0 && mouseX < this.xMax && mouseY > 0 && mouseY < this.yMax){
			let mousePos = createVector(mouseX, mouseY);
			let diff = p5.Vector.sub(this.pos, mousePos);
			if(diff.mag() > 100){
				return createVector(0,0);
			}
			return(diff.normalize(1/((diff.mag())**2)));
		} else{
			return createVector(0,0);
		}
	}

	update(){

		if(this.state=='CITY'){ // you were city but now outside border

			if(!this.land.contains(this.pos)){
				this.applyForce(this.computeFirstForce()); // start 
				this.state = 'FALL';
			}

		} else if(this.state == 'FALL'){

			this.applyForce(this.computeGravityForce());
			this.applyForce(this.computeWaterResistanceForce());
			this.applyForce(this.computeMouseForce().mult(0.2));
			this.pos.add(this.velocity);
			this.applyPosBoundaries();

			if(this.shouldBeCoral()){
				this.state = 'CORAL';
			}

		} else if(this.state == 'CORAL'){
			this.velocity = createVector(0,0);
		}

	}

	applyPosBoundaries(){
		if(this.pos.x > this.xMax){
			this.pos.x = 0;
		}
		if(this.pos.y > this.yMax){
			this.pos.y = this.yMax;
		}
		if(this.pos.x < 0){
			this.pos.x = this.xMax;
		}
		if(this.pos.y < 0){
			this.pos.y = 0;
		}
	}

	shouldBeCoral(){
		if(this.pos.y >= seaFloorLevel){
			return true
		} else if(this.closeToCoral()){
			return true
		} else{
			return false;
		}
	}

	closeToCoral(){
		for(let j=0; j < drivers.length; j++){
			if(drivers[j].getState()=='CORAL' && p5.Vector.dist(this.pos, drivers[j].getPos()) < this.size){
				return true;
			}
		}
		return false;
	}

	getPos(){
		return this.pos;
	}

	getState(){
		return this.state;
	}

	draw(){
		push();
		noStroke();
		fill(25,80);
		if(this.state != 'CITY'){
			fill(this.color);
		}
		circle(this.pos.x, this.pos.y, this.size);
		pop();
	}


}