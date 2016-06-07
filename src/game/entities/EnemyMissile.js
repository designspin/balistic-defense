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
	  ctx.strokeStyle = "#FF0000";
	  ctx.moveTo(this.startX, this.startY);
	  ctx.lineTo(this.x, this.y);
	  ctx.lineWidth = 2;
	  ctx.stroke();
	  ctx.beginPath();
	  ctx.fillStyle = '#' + (function co(lor){   return (lor +=
	  [0,1,2,3,4,5,6,7,8,9,'a','b','c','d','e','f'][Math.floor(Math.random()*16)])
	  && (lor.length == 6) ?  lor : co(lor); })('');
	  ctx.rect(this.x - 1, this.y - 1, 2 ,2);
	  ctx.fill();
	}

	explode(x, y) {
		this.game.missilesInPlay -= 1;
		let explosion = new Explosion(this.game, x, y, this);
   	this.game.addEntity(explosion);
	} 
}