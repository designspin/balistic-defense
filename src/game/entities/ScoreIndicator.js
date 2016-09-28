import Entity from '../../lib/GameEntity';
import Easing from '../objects/Easing';

export default class extends Entity {
	constructor(game, x, y, score) {
		super(game, x, y);

		this.score = score;
		
		this.opacity = 1;
		this.timer = 0;
	}	

	update() {
		this.timer += this.game.clockTick;

		this.opacity = 1 - (Easing.easeOutQuad(this.timer, 0, 1, 1));
		this.y += Easing.easeOutQuad(this.timer, 0, 2, 1);

		if(this.timer > 1) {
			this.removeFromWorld = true;
		}
	}

	draw(ctx) {
		super.draw(ctx);

		ctx.save();
		ctx.translate(0, ctx.canvas.height);
		ctx.scale(1, -1);
		ctx.fillStyle = `rgba(0, 0, 0, ${this.opacity})`;
		ctx.font = '10px Arial';
		ctx.fillText(this.score, this.x, ctx.canvas.height - this.y);
		ctx.restore();
	}
}