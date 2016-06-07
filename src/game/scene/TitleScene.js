export default class {
	constructor(game) {
		this.game = game;
		this.opacity = 0.1;
		this.toggle = true;
	}

	update() {
		const toggle = (this.toggle) ? (this.opacity < 1 ? this.opacity += 0.01 : this.toggle = !this.toggle) : (this.opacity > 0 ? this.opacity -= 0.01 : this.toggle = !this.toggle);

		if(this.game.click) {
			this.game.click = null;
			this.game.levelup(); // Fire FSM startgame event;
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
		ctx.strokeText('Balistic Defence', ctx.canvas.width / 2, ctx.canvas.height / 2 - 20);
		ctx.fillStyle = "rgba(255, 255, 255, " + this.opacity + ")";
		ctx.font = '20px Arial';
		ctx.fillText('click or touch to start', ctx.canvas.width / 2, ctx.canvas.height / 2 + 20);
	}
}