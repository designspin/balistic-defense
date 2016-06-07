import Entity from '../../lib/GameEntity';
import MissileTarget from './MissileTarget';
import SmokeTrail from './SmokeTrail';
import Explosion from './Explosion';

export default class extends Entity {
	constructor(game, x, y, startX, startY) {
		super(game, startX, startY)
		this.speed = 500;
		this.targetX = x;
		this.targetY = y;
		this.targetGraphic = new MissileTarget(game, x, y);
		game.addEntity(this.targetGraphic);
		this.angle = Math.atan2(x - startX, y - startY);
		this.startX = startX;
		this.startY = startY;
	}

	update() {
		super.update()
		
		let particle = new SmokeTrail(this.game, this.x, this.y, this.angle);
		this.game.addEntity(particle);

		this.x += (this.speed * this.game.clockTick) * Math.sin(this.angle);
		this.y += (this.speed * this.game.clockTick) * Math.cos(this.angle);

		if(Math.abs(this.y - this.targetY) < 5 && Math.abs(this.x - this.targetX) < 5) {
			this.removeFromWorld = true;
			this.targetGraphic.removeFromWorld = true;
			let explosion = new Explosion(this.game, this.targetX, this.targetY, this);
			this.game.addEntity(explosion);
		}
	}

	draw(ctx) {
		super.draw(ctx);
		ctx.fillStyle = "#FFFFFF";
		ctx.beginPath();
		ctx.fillRect(this.x-1, this.y-1, 3, 3);
		ctx.stroke();
	}
}