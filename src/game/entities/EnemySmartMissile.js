import Entity from '../../lib/GameEntity';
import MissileTarget from './MissileTarget';
import Explosion from './Explosion';

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

		this.angle = Math.atan2(this.targetX - this.x, this.targetY - this.y);
		this.distanceToTravel = this.getDistance(this.x, this.y, this.targetX, this.targetY);
		this.normalised = { x: (this.x - this.targetX) / this.distanceToTravel, y: (this.y - this.targetY) / this.distanceToTravel };
		this.lookAhead = { x: this.x - this.normalised.x * (this.speed / 2) , y: this.y - this.normalised.y * (this.speed / 2) };
		this.lookAhead2 = { x: this.x - this.normalised.x * (this.speed / 2) / 2, y: this.y - this.normalised.y * (this.speed / 2) / 2 };

		let avoidance = this.collisionAvoidance();

		if (this.hitTarget === false) {
	    this.x += (this.speed * this.game.clockTick) * (Math.sin(this.angle) + avoidance.x);
	    this.y += (this.speed * this.game.clockTick) * (Math.cos(this.angle) + avoidance.y);
	  }
		
	}

	draw(ctx) {
		super.draw(ctx);
		
		ctx.beginPath();
		ctx.fillStyle = '#FFA500' 
		ctx.rect(this.x - 1, this.y - 1, 2 ,2);
		ctx.fill();
		ctx.beginPath();
		ctx.fillStyle = '#ff0000';
		ctx.rect(this.lookAhead.x - 1, this.lookAhead.y - 1, 2 ,2);
	 	ctx.fill();
	 	ctx.beginPath();
		ctx.fillStyle = '#00ff00';
		ctx.rect(this.lookAhead2.x - 1, this.lookAhead2.y - 1, 2 ,2);
	 	ctx.fill();
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
			avoidance.x * 10000;
			avoidance.y * 10000;
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