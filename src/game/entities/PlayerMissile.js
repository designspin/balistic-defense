import Entity from '../../lib/GameEntity';
import MissileTarget from './MissileTarget';
import SmokeTrail from './SmokeTrail';
import Explosion from './Explosion';
import Easing from '../objects/Easing';

export default class extends Entity {
	constructor(game, x, y, startX, startY) {
		super(game, startX, startY)
		this.speed = 200;
		this.targetX = x;
		this.targetY = y;
		this.time = 0;
		this.targetGraphic = new MissileTarget(game, x, y);
		game.addEntity(this.targetGraphic);
		this.angle = Math.atan2(x - startX, y - startY);
		this.startX = startX;
		this.startY = startY;
		this.distanceToTravel = this.getDistance(x, y, startX, startY);
	}

	update() {
		super.update()
		
		let particle = new SmokeTrail(this.game, this.x, this.y, this.angle);
		this.game.addEntity(particle);


		this.x += Easing.easeInCirc(this.time, 0, this.speed, 3) * Math.sin(this.angle); 
		this.y += Easing.easeInCirc(this.time, 0, this.speed, 3) * Math.cos(this.angle); 

		if(this.getDistance(this.x, this.y, this.startX, this.startY) >= this.distanceToTravel) {
			this.removeFromWorld = true;
			this.targetGraphic.removeFromWorld = true;
			let explosion = new Explosion(this.game, this.targetX, this.targetY, this);
			this.game.addEntity(explosion);
		}

		this.time += this.game.clockTick;
	}

	draw(ctx) {
		super.draw(ctx);
		ctx.fillStyle = "#FFFFFF";
		ctx.beginPath();
		ctx.fillRect(this.x-1, this.y-1, 3, 3);
		ctx.stroke();
	}

	getDistance(x1, y1, x2, y2) {
		const a = x1 - x2;
    	const b = y1 - y2;
    	const length = Math.sqrt((a * a) + (b * b));

    	return length;
	}
}