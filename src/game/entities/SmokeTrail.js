import Entity from '../../lib/GameEntity';

export default class extends Entity {
	constructor(game, x, y, angle) {
		super(game, x, y);
		this.updateCount = 0;
		this.radius = 5;
		this.speed = 2;
		this.opacity = 0.3;
		this.angle = angle;
	}

	update() {
		super.update();

		if(this.game.speedMultiplier) {
			this.speed = 10;
		}

		this.x += ((10*Math.random()) * this.game.clockTick) * Math.sin(this.angle);
	  this.y += ((40*Math.random()) * this.game.clockTick) * Math.cos(this.angle);
	  
	  this.radius = this.radius - (this.speed * this.game.clockTick);
	  
	  if (this.radius < 1) {
	    this.removeFromWorld = true;
	  }

	  this.updateCount += 1;
	}

	draw(ctx) {
		super.draw(ctx);

	if(this.updateCount < 3) {
	    ctx.fillStyle = "rgba(255, 255, 0," + 0.3 + ")";
	  }
	  else if(this.updateCount < 6) {
	    ctx.fillStyle = "rgba(255, 167, 0," + 0.3 + ")";
	  }
	  else {
	    ctx.fillStyle = "rgba(255, 255, 255," + this.opacity  + ")";
	  }

	  ctx.beginPath();
	  ctx.arc(this.x,this.y,this.radius,0,2*Math.PI);
	  ctx.fill();
	}
}