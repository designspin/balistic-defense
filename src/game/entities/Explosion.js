import Entity from '../../lib/GameEntity';
import EnemyMissile from './EnemyMissile';
import PlayerMissile from './PlayerMissile';
import { Events } from '../objects/constants';

export default class extends Entity {
	constructor(game, x, y, createdBy) {
		super(game, x, y);
		this.createdBy = createdBy;
		this.imploding = false;
		this.maxRadius = 20;
		this.speed = 20;
		this.radius = 1;
	}

	update() {
		super.update();

		if(this.game.speedMultiplier) {
			this.speed = 150;
		}

		if(this.radius >=  this.maxRadius) {
			this.imploding = true;
		}

		if(!this.imploding) {
			this.radius += this.speed * this.game.clockTick;
		} else {
			this.radius -= this.speed * this.game.clockTick;
		}

		for (let i = 0; i < this.game.entities.length; i++) {
			let entity = this.game.entities[i];

			if(entity instanceof EnemyMissile && entity.hitTarget === false && this.isCaughtInExplosion(entity)) {

				if(this.createdBy instanceof PlayerMissile) {
					this.game.publish(Events.PLAYER_KILLED_ENEMY_MISSILE);
					entity.explode(entity.x, entity.y, this.createdBy);
				} else {
					entity.explode(entity.x, entity.y);
				}
				
				entity.targetX = entity.x;
				entity.targetY = entity.y;
				entity.hitTarget = true;
			}
		}

		if(this.radius < 1) {
			this.removeFromWorld = true;

			if(this.createdBy instanceof PlayerMissile) {
				this.createdBy.targetGraphic.removeFromWorld = true;
			}
		}
	}

	draw(ctx) {
		// Create gradient
      let grd = ctx.createRadialGradient(this.x, this.y, this.radius / 4, this.x, this.y, this.radius);
      
      // Add colors
      grd.addColorStop(0.379, 'rgba(255, 255, 255, 1.000)');
      grd.addColorStop(0.551, 'rgba(255, 255, 0, 1.000)');
      grd.addColorStop(0.877, 'rgba(255, 127, 0, 1.000)');
      grd.addColorStop(0.937, 'rgba(255, 0, 0, 0.714)');

		ctx.fillStyle = grd;
		ctx.beginPath();
		ctx.arc(this.x, this.y, this.radius, 0, 2*Math.PI);
		ctx.fill();
	}

	isCaughtInExplosion(entity) {
	const distance_squared = (((this.x - entity.x) * (this.x - entity.x)) + ((this.y - entity.y) * (this.y - entity.y)));
	  const radii_squared = (this.radius + entity.radius) * (this.radius + entity.radius);
	  return distance_squared < radii_squared;
	} 
}