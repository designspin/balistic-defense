import Entity from '../../lib/GameEntity';

import SmokeTrail from './SmokeTrail';
import Explosion from './Explosion';
import EnemyMissile from './EnemyMissile';

export default class extends Entity {
	constructor(game, x, y, position) {
		super(game, x, y);
		this.sprite = this.game.ASSET_MANAGER.getAsset('images/City.png');
		this.radius = 16;
		this.position = position;
	}

	draw(ctx) {
		super.draw(ctx);
		ctx.save();
		ctx.translate(-this.sprite.width / 2, -this.sprite.height / 2);
		ctx.drawImage(this.sprite, this.x, this.y);
		ctx.restore()
	}

	update() {
		for (let i = 0; i < this.game.entities.length; i++) {
			let entity = this.game.entities[i];

			if(entity instanceof EnemyMissile && this.isHit(entity)) {
				this.removeFromWorld = true;
				this.game.cities.qty -= 1;
				this.game.cities.info[this.position].isAlive = false;
				entity.hitTarget = true;
				entity.targetX = entity.x;
				entity.targetY = entity.y;
				entity.explode(entity.x, entity.y);
				let explosion = new Explosion(this.game, this.x, this.y);
				this.game.addEntity(explosion);

				for(let i = 0; i < 40; i++) {
					let smoke = new SmokeTrail(this.game, this.x, this.y, 0 + (i+1 * 10));
					this.game.addEntity(smoke);
				}
			}
		}
	}

	isHit(entity) {
		let distance_squared = (((this.x - entity.x) * (this.x - entity.x)) + ((this.y - entity.y) * (this.y - entity.y)));
	  let radii_squared = (this.radius + entity.radius) * (this.radius + entity.radius);
	  return distance_squared < radii_squared;
	}

	cachedCityImage() {
		const offscreencanvas = document.createElement('canvas');
		const offscreenctx = offscreencanvas.getContext('2d');

		offscreencanvas.width = 32;
		offscreencanvas.height = 32;

		offscreenctx.save();
	  offscreenctx.beginPath(); 
	  offscreenctx.fillStyle = 'blue';
	  offscreenctx.rect(0, 0, 4, 25);
	  offscreenctx.rect(7, 0, 4, 22);
	  offscreenctx.rect(14, 0, 4, 32);
	  offscreenctx.rect(21, 0, 4, 15);
	  offscreenctx.rect(28, 0, 4, 27);
	  offscreenctx.fill();
	  offscreenctx.beginPath();
	  offscreenctx.fillStyle = 'cyan';
	  offscreenctx.rect(2, 0, 4, 15);
	  offscreenctx.rect(8, 0, 4, 18);
	  offscreenctx.rect(18, 0, 4, 24);
	  offscreenctx.fill();

	  return offscreencanvas;
	}
}