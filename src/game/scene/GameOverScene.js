export default class {
	constructor(game) {
		this.game = game;
		this.timer = 0;
	}

	update() {
		this.timer += this.game.clockTick;

		if(this.timer > 3) {

			if(this.game.score.isHighScore()) {
				this.game.highscore();
			} else {
				this.game.levelreset();
			}
		}
	}

	draw(ctx) {
		ctx.restore();
		ctx.strokeStyle = '#ffffff';
		ctx.fillStyle = '#000000';
		ctx.lineWidth = 1;
		ctx.textBaseline = 'middle';
		ctx.textAlign = 'center';
		ctx.font = '40px Arial';
		ctx.fillText(`GAME OVER`, ctx.canvas.width / 2, ctx.canvas.height / 2 - 20);
		ctx.strokeText(`GAME OVER`, ctx.canvas.width / 2, ctx.canvas.height / 2 - 20);
	}
}