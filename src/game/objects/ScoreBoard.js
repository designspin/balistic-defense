export default class {
	
	constructor(ctx) {
		this.currentScore = 0;
		this.ctx = ctx;
	}

	add(n) {
		this.currentScore += n;
	}

	minus(n) {
		this.currentScore -= n;
	}

	reset() {
		this.currentScore = 0;
	}

	draw() {
		let ctx = this.ctx;
		ctx.save();
		ctx.translate(0, ctx.canvas.height);
		ctx.scale(1, -1);
		ctx.font = '12px Arial';
		ctx.fillStyle = '#fff';
		ctx.textBaseline = 'top';
		ctx.textAlign = 'end';
		ctx.fillText(`Score: ${this.currentScore}` , ctx.canvas.width - 10, 10);
		ctx.restore();
  	
	}
}