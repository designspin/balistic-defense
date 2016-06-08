import Entity from '../../lib/GameEntity';
import Explosion from './Explosion';

export default class extends Entity {
	constructor(game, x, y, startX, startY, speed) {
		super(game, startX, startY);
		this.hitTarget = false;
		this.radius = 2;
		this.speed = speed;
		this.targetX = x;
		this.targetY = y;
		this.angle = Math.atan2(x - startX, y - startY);
		this.startX = startX;
		this.startY = startY;
	}

	update() {
		super.update();

		if(this.game.speedMultiplier) {
			this.speed = 150;
		}

		if (this.hitTarget === false) {
	    this.x += (this.speed * this.game.clockTick) * Math.sin(this.angle);
	    this.y += (this.speed * this.game.clockTick) * Math.cos(this.angle);
	  }

	  if (this.hitTarget === true) {
	    this.startX += ((this.speed * 20) * this.game.clockTick) * Math.sin(this.angle);
	    this.startY += ((this.speed * 20) * this.game.clockTick) * Math.cos(this.angle);
	  }

    if (Math.abs(this.y - this.targetY) < 2 && this.hitTarget === false) {
	    this.hitTarget = true;
	    this.explode(this.targetX, this.targetY);
	  }

	  if (this.hitTarget === true && (this.startY - this.targetY) < 0) {
	    this.removeFromWorld = true;
	  }
	}

	draw(ctx) {
		super.draw(ctx);
		ctx.beginPath();
		let gradient = ctx.createLinearGradient(this.startX, this.startY, this.x, this.y);
		gradient.addColorStop(0, "rgba(255,255,255,0.1)");
		gradient.addColorStop(0.8, "rgba(255,255,255,0.9)")
		gradient.addColorStop(1, "rgba(255,255,0,0.9)");
		ctx.strokeStyle = gradient;
		ctx.moveTo(this.startX, this.startY);
		ctx.lineTo(this.x, this.y);
		ctx.lineWidth = 2;
		ctx.stroke();
		ctx.beginPath();
		ctx.fillStyle = '#FFA500' 
		ctx.rect(this.x - 1, this.y - 1, 2 ,2);
	 	ctx.fill();
	}

	explode(x, y) {
		this.game.missilesInPlay -= 1;
		let explosion = new Explosion(this.game, x, y, this);
   		this.game.addEntity(explosion);
	} 
}