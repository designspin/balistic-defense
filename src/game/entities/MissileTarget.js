import Entity from '../../lib/GameEntity';

export default class extends Entity {
	constructor(game, x, y) {
		super(game, x, y);
		this.radius = 8;
	}

	draw(ctx) {
		super.draw(ctx);
		ctx.strokeStyle = '#FFFFFF';
	  ctx.beginPath();
	  ctx.moveTo(this.x - 4, this.y - 2);
	  ctx.lineTo(this.x + 4, this.y + 2);
	  ctx.moveTo(this.x + 4, this.y - 2);
	  ctx.lineTo(this.x - 4, this.y + 2);
	  ctx.stroke();
	}
}