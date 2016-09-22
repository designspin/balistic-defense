import Entity from '../../lib/GameEntity';

import EnemyMissile from '../entities/EnemyMissile';
import Explosion from '../entities/Explosion';

export default class extends Entity {
	constructor(game, x, y) {
    super(game, x, y);
    this.hitTriangle = {p1: {x: x, y: y+5}, p2: {x: x-12, y: y-38}, p3: {x: x+12, y: y-38}};
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
    for (let i = 0; i < this.game.entities.length; i++) {
      let entity = this.game.entities[i];

      if(entity instanceof EnemyMissile && this.isHit(entity)) {
        if(entity.hitTarget === false) {
          entity.hitTarget = true;
          entity.explode(entity.x, entity.y);
          let explosion = new Explosion(this.game, this.x, this.y-19);
          this.game.addEntity(explosion);
          this.missiles = 0;   
        }
      }
    }
  }

  isHit(entity) {
    let p1 = this.hitTriangle.p1;
    let p2 = this.hitTriangle.p2;
    let p3 = this.hitTriangle.p3;
    let p = entity;

    let alpha = ((p2.y - p3.y)*(p.x - p3.x) + (p3.x - p2.x)*(p.y - p3.y)) /
        ((p2.y - p3.y)*(p1.x - p3.x) + (p3.x - p2.x)*(p1.y - p3.y));
    let beta = ((p3.y - p1.y)*(p.x - p3.x) + (p1.x - p3.x)*(p.y - p3.y)) /
       ((p2.y - p3.y)*(p1.x - p3.x) + (p3.x - p2.x)*(p1.y - p3.y));
    let gamma = 1 - alpha - beta;

    return ( alpha > 0 && beta > 0 && gamma > 0);
  }


  draw(ctx) {
    super.draw(ctx);
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
