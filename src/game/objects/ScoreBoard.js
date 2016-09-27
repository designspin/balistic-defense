export default class {
	
	constructor(ctx, key, defaultScores) {
		this.currentScore = 0;
		this.highScores = defaultScores || [];
		this.ctx = ctx;
		this.key = key;
		this.init();
	}

	init() {
		if(localStorage && localStorage.getItem(this.key)) {
			this.highScores = JSON.parse(localStorage.getItem(this.key));
		} 
	}

	add(n) {
		this.currentScore += n;
	}

	isHighScore() {
		for(let i = 0; i < this.highScores.length; i++) {
			if(this.currentScore > this.highScores[i].score) {
				return true;
			}
		}
		return false;
	}

	addHighScore(name) {
		let position = null;
		
		for (let i = 0; i < this.highScores.length; i++) {

			let row = this.highScores[i];
			
			if (this.currentScore > row.score) {
				position = i;
				break;
			}
		}
		console.log(`position: ${position}`);
		if(position != null) {
			this.highScores.splice(position, 0, { name: name, score: this.currentScore });
			this.highScores.pop();

			if(localStorage) {
				localStorage.setItem(this.key, JSON.stringify(this.highScores));
			}
		}
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

	drawHighScores() {

		

		let ctx = this.ctx;
		ctx.save();
		ctx.translate(0, ctx.canvas.height);
		ctx.scale(1, -1);

		ctx.fillStyle = '#ffffff';
		ctx.lineWidth = 1;
		ctx.textAlign = 'center';
		ctx.font = '20px Arial';
		ctx.fillText('TOP DEFENDERS', ctx.canvas.width / 2, 60);

		ctx.font = '12px Arial';
		ctx.fillStyle = '#fff';
		for (var i = 0; i < this.highScores.length; i++) {
			let entry = this.highScores[i];
			ctx.textAlign = 'start';
			ctx.fillText(`${entry.name}`, (ctx.canvas.width / 2) - 70, (((ctx.canvas.height - 200) / this.highScores.length) * i) + 100);
			ctx.textAlign = 'end';
			ctx.fillText(`${entry.score}`, (ctx.canvas.width / 2) + 70, (((ctx.canvas.height - 200) / this.highScores.length) * i) + 100);
		}
		ctx.restore();
	}
}