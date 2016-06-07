export default class {
	constructor(game, wave) {
		this.game = game;
		this.wave = wave;
		this.opacity = 0.1;
		this.toggle = true;
		this.timer = 0;
	}

	update() {
		this.timer += this.game.clockTick;
		const toggle = (this.toggle) ? (this.opacity < 1 ? this.opacity += 0.05 : this.toggle = !this.toggle) : (this.opacity > 0 ? this.opacity -= 0.05 : this.toggle = !this.toggle);

		if(this.timer > 3) {
			this.game.startgame();
		}
	}

	draw(ctx) {
		ctx.restore();
		ctx.strokeStyle = '#ffffff';
		ctx.fillStyle = '#ffffff';
		ctx.lineWidth = 1;
		ctx.textBaseline = 'middle';
		ctx.textAlign = 'center';
		ctx.font = '40px Arial';
		ctx.strokeText('Wave' + this.wave, ctx.canvas.width / 2, ctx.canvas.height / 2 - 20);
		ctx.fillStyle = "rgba(255, 255, 255, " + this.opacity + ")";
		ctx.font = '20px Arial';
		ctx.fillText('Incoming', ctx.canvas.width / 2, ctx.canvas.height / 2 + 20);
	}
}