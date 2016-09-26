export default class {
	constructor(game, wave) {
		this.game = game;
		this.wave = wave;
		this.opacity = 0.1;
		this.toggle = true;
		this.timer = 0;
		this.updates = 0;
		this.game.audioplayer.play('incoming');
	}

	update() {
		this.timer += this.game.clockTick;
		const toggle = (this.toggle) ? (this.opacity < 1 ? this.opacity += 0.05 : this.toggle = !this.toggle) : (this.opacity > 0.05 ? this.opacity -= 0.05 : this.toggle = !this.toggle);

		if(this.timer > 1) {
			this.timer = 0;
			this.updates += 1;
			this.game.audioplayer.play('incoming');
		}

		if(this.updates > 3) {
			this.game.startgame();
		}
	}

	draw(ctx) {
		this.game.score.draw();
		ctx.restore();
		ctx.strokeStyle = '#ffffff';
		ctx.fillStyle = '#000000';
		ctx.lineWidth = 1;
		ctx.textBaseline = 'middle';
		ctx.textAlign = 'center';
		ctx.font = '40px Arial';
		ctx.fillText(`Wave ${this.wave}`, ctx.canvas.width / 2, ctx.canvas.height / 2 - 20);
		ctx.strokeText(`Wave ${this.wave}`, ctx.canvas.width / 2, ctx.canvas.height / 2 - 20);
		ctx.fillStyle = "rgba(255, 0, 0, " + this.opacity + ")";
		ctx.font = '20px Arial';
		ctx.fillText('Incoming', ctx.canvas.width / 2, ctx.canvas.height / 2 + 20);
	}
}