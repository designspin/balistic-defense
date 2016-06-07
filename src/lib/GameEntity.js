export default class {
	constructor(game, x, y) {
		this.game = game;
		this.x = x;
		this.y = y;
		this.removeFromWorld = false;
	}

	update() {
	}

	draw(ctx) {
		if (this.game.showOutlines && this.radius) {
        ctx.beginPath();
        ctx.strokeStyle = "green";
        ctx.lineWidth = 1;
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2, false);
        ctx.stroke();
        ctx.closePath();
    }
	}
}