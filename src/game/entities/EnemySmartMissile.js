import Entity from '../../lib/GameEntity';
import MissileTarget from './MissileTarget';
import Explosion from './Explosion';
import SmokeTrail from './SmokeTrail';

export default class extends Entity {
	constructor(game, x, y, startX, startY, speed) {
		super(game, startX, startY);

		this.hitTarget = false;
		this.radius = 4;
		this.speed = speed;
		this.targetX = x;
		this.targetY = y;
		this.angle = Math.atan2(x - startX, y - startY);
		this.startX = startX;
		this.startY = startY;
		
		this.distanceToTravel = this.getDistance(startX, startY, x, y);
		this.normalised = { x: (startX - x) / this.distanceToTravel, y: (startY - y) / this.distanceToTravel };
		this.lookAhead = { x: this.x + this.normalised.x * 100, y: this.y + this.normalised.y * 100 };
		this.lookAhead2 = { x: this.x + this.normalised.x * 50, y: this.y + this.normalised.y * 50 }; 
	}

	update() {
		super.update();

		if(this.game.speedMultiplier) {
			this.speed = 150;
		}
		
		let particle = new SmokeTrail(this.game, this.x - (10 * Math.sin(this.angle)), this.y - (8 * Math.cos(this.angle)), this.angle);
		particle.radius = 3;
		this.game.addEntity(particle);

		this.angle = Math.atan2(this.targetX - this.x, this.targetY - this.y);
		this.distanceToTravel = this.getDistance(this.x, this.y, this.targetX, this.targetY);
		console.log(this.distanceToTravel);
		this.normalised = { x: (this.x - this.targetX) / this.distanceToTravel, y: (this.y - this.targetY) / this.distanceToTravel };
		this.lookAhead = { x: this.x - this.normalised.x * (this.speed / 2) , y: this.y - this.normalised.y * (this.speed / 2) };
		this.lookAhead2 = { x: this.x - this.normalised.x * (this.speed / 2) / 2, y: this.y - this.normalised.y * (this.speed / 2) / 2 };

		let avoidance = this.collisionAvoidance();

		if (this.hitTarget === false) {
		    this.x += (this.speed * this.game.clockTick) * (Math.sin(this.angle) + avoidance.x);
		    this.y += (this.speed * this.game.clockTick) * (Math.cos(this.angle) + avoidance.y);
	  	}
		if (this.distanceToTravel < 1 && this.hitTarget === false) {
	    this.hitTarget = true;
	    this.removeFromWorld = true;
	    this.explode(this.targetX, this.targetY);
	  }
	  if(this.hitTarget == true) {
	  	this.removeFromWorld = true;
	  }
	}

	drawTriangle(ctx) {
		let height = 8;
		let width = 4;

		let centerX = this.x;
		let centerY = this.y;

		let x1 = centerX;
		let y1 = centerY - height / 2;
		let x2 = centerX + width / 2;
		let y2 = centerY + height / 2;
		let x3 = centerX - width / 2;
		let y3 = y2;

		let x1r = ((x1 - centerX) * -Math.cos(this.angle) - (y1 - centerY) * Math.sin(this.angle) + centerX);
		let y1r = ((x1 - centerX) * Math.sin(this.angle) + (y1 - centerY) * -Math.cos(this.angle) + centerY);

		let x2r = ((x2 - centerX) * -Math.cos(this.angle) - (y2 - centerY) * Math.sin(this.angle) + centerX);
		let y2r = ((x2 - centerX) * Math.sin(this.angle) + (y2 - centerY) * -Math.cos(this.angle) + centerY);

		let x3r = ((x3 - centerX) * -Math.cos(this.angle) - (y3 - centerY) * Math.sin(this.angle) + centerX);
		let y3r = ((x3 - centerX) * Math.sin(this.angle) + (y3 - centerY) * -Math.cos(this.angle) + centerY);

		ctx.moveTo(x1r, y1r);
		ctx.lineTo(x2r, y2r);
		ctx.lineTo(x3r, y3r);
		ctx.lineTo(x1r, y1r);
	}
	draw(ctx) {
		super.draw(ctx);
		ctx.save();
		ctx.beginPath();
		ctx.fillStyle = '#000000' 
		this.drawTriangle(ctx);
		ctx.fill();
		ctx.restore();
	}

	explode(x, y, instance) {
		this.game.audioplayer.play('explosion');
		this.game.missilesInPlay -= 1;
		let explosion = new Explosion(this.game, x, y, (instance) ? instance : this);
   	this.game.addEntity(explosion);
	}

	lineIntersectsCircle(ahead, ahead2, obstacle) {
		return this.getDistance(obstacle.x, obstacle.y, ahead.x, ahead.y) < obstacle.radius || this.getDistance(obstacle.x, obstacle.y, ahead2.x, ahead2.y) < obstacle.radius; 
	}

	collisionAvoidance() {
		let mostThreatening = this.findThreat()
		let avoidance = { x: 0, y: 0 };

		if (mostThreatening != null) {
			avoidance.x = this.lookAhead.x - mostThreatening.x;
			avoidance.y = this.lookAhead.y - mostThreatening.y;

			// Create a vector library for the next game!
			let length = Math.sqrt(avoidance.x * avoidance.x + avoidance.y * avoidance.y);
			avoidance.x /= length;
			avoidance.y /= length;
			avoidance.x / 0.005;
			avoidance.y / 0.005;
		} else {
			avoidance.x = 0;
			avoidance.y = 0;
		}

		return avoidance;
	}

	findThreat() {
		let mostThreatening = null;

		for(let i = 0; i < this.game.entities.length; i++) {
			let obstacle = this.game.entities[i];
			let collision = null;

			if(obstacle instanceof MissileTarget || obstacle instanceof Explosion) {
				collision = this.lineIntersectsCircle(this.lookAhead, this.lookAhead2, obstacle);
			} else {
				continue;
			}

			if (collision && (mostThreatening == null || this.getDistance(this.x, this.y, obstacle.x, obstacle.y) 
				< this.getDistance(this.x, this.y, mostThreatening.x, mostThreatening.y ))) {
				mostThreatening = obstacle;
			}
		}
		
		return mostThreatening;
	}

	explode(x, y, instance) {
		this.game.audioplayer.play('explosion');
		this.game.missilesInPlay -= 1;
		let explosion = new Explosion(this.game, x, y, (instance) ? instance : this);
   		this.game.addEntity(explosion);
	}

	getDistance(x1, y1, x2, y2) {
		const a = x1 - x2;
    	const b = y1 - y2;
    	const length = Math.sqrt((a * a) + (b * b));

    	return length;
	}
}