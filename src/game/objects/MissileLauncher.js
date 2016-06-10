import Entity from '../../lib/GameEntity';

export default class extends Entity {
	constructor(game, x, y) {
    super(game, x, y)
    this.radius = 20;
		this.missiles = 10;
    this.sprite = game.ASSET_MANAGER.getAsset('images/missile-indicator.png');
	}

	getDistance(targetX, targetY, scale) {
		const a = (targetX / scale) - this.x;
    const b = (targetY / scale) - this.y;
    const length = Math.sqrt((a * a) + (b * b));

    return length;
	}

  update() {
    super.update();
  }

  draw(ctx) {
    super.draw(ctx);
    console.log("Draw Missile Launcher!");
    this.drawMissileIndicators(ctx);
  }

	drawMissileIndicators(ctx) {		
		if(this.missiles < 4 && this.missiles > 0) {
			ctx.restore();
      ctx.fillStyle = "#0000FF";
      ctx.font = "10px Arial";
      ctx.textAlign = 'center';
      ctx.fillText("LOW", this.x, -this.y + ctx.canvas.height+30);
      ctx.save();
      ctx.translate(0, ctx.canvas.height);
  		ctx.scale(1, -1);
		}
		
		if (this.missiles < 1) {
			ctx.restore();
    	ctx.fillStyle = "#0000FF";
    	ctx.font = "10px Arial";
    	ctx.textAlign = 'center';
    	ctx.fillText("OUT", this.x, -this.y + ctx.canvas.height+30);
    	ctx.save();
    	ctx.translate(0, ctx.canvas.height);
    	ctx.scale(1, -1);
		}

		
		for(let m = 0; m < this.missiles; m++) {
    
      ctx.save();
      ctx.translate(-3, -5);
			if(m === 0) {
        ctx.drawImage(this.sprite, this.x, this.y, this.sprite.width, this.sprite.height);
      }
      if(m === 1) {
        ctx.drawImage(this.sprite, this.x-3, this.y-11, this.sprite.width, this.sprite.height);
      }
      if(m === 2) {
        ctx.drawImage(this.sprite, this.x+3, this.y-11, this.sprite.width, this.sprite.height);
      }
      if(m === 3) {
        ctx.drawImage(this.sprite, this.x-6, this.y-22, this.sprite.width, this.sprite.height);
      }
      if(m === 4) {
        ctx.drawImage(this.sprite, this.x, this.y-22, this.sprite.width, this.sprite.height);
      }
      if(m === 5) {
        ctx.drawImage(this.sprite, this.x+6, this.y-22, this.sprite.width, this.sprite.height);
      }
      if(m === 6) {
        ctx.drawImage(this.sprite, this.x-9, this.y-33, this.sprite.width, this.sprite.height);
      }
      if(m === 7) {
        ctx.drawImage(this.sprite, this.x-3, this.y-33, this.sprite.width, this.sprite.height);
      }
      if(m === 8) {
        ctx.drawImage(this.sprite, this.x+3, this.y-33, this.sprite.width, this.sprite.height);
      }
      if(m === 9) {
        ctx.drawImage(this.sprite, this.x+9, this.y-33, this.sprite.width, this.sprite.height);
      }
      ctx.restore();
      
		}
	}

}
