import City from '../entities/City';

export default class {
	constructor(game) {
		this.game = game;

		this.timer = 0;
		this.updateInterval = 1;

		this.bonusHandler = ['cities', 'missiles'];
		this.currentHandler = 0;

		this.cityBonusScore = 0;
		this.missileBonusScore = 0;

		this.citiesSurvived = [];

		this.setupCitiesSurvived();
	}

	setupCitiesSurvived() {
		let cities = this.game.cities.info;
		let xPos = 132;


		for(let city = 0; city < cities.length; city++) {
			if (cities[city].isAlive) {
				this.citiesSurvived.push({x: (this.game.ctx.canvas.width / 2) + xPos , y: this.game.ctx.canvas.height / 2, original: cities[city].instance });
				xPos += 42;
			}
		}
	}

	update() {
		this.timer += this.game.clockTick;

		if(this.timer >= this.updateInterval) {
			this.timer = 0;

			switch (this.bonusHandler[this.currentHandler]) {
				case 'cities':
					if(this.citiesSurvived.length) {
						this.citiesSurvived[this.citiesSurvived.length - 1].original.removeFromWorld = true;
						this.game.addEntity(new City(this.game, this.citiesSurvived[this.citiesSurvived.length - 1].x, this.citiesSurvived[this.citiesSurvived.length - 1].y));
						this.citiesSurvived.pop();
						this.cityBonusScore += 100;
					} else {
						this.currentHandler += 1;
					}
			}

		}
	}

	draw(ctx) {
		this.drawLandscape(ctx);
		this.drawMissileIndicators(ctx);
		
		ctx.restore();
		ctx.strokeStyle = '#ffffff';
		ctx.fillStyle = '#ffffff';
		ctx.lineWidth = 1;
		ctx.textBaseline = 'middle';
		ctx.textAlign = 'center';
		ctx.font = '40px Arial';
		ctx.strokeText(`Wave ${this.game.wave} Complete`, ctx.canvas.width / 2, ctx.canvas.height / 2 - 100);
		ctx.font = '20px Arial';
		ctx.fillText('Bonus',  ctx.canvas.width / 2, ctx.canvas.height / 2 - 50);
		ctx.fillStyle = '#ffff00';
		ctx.textAlign = 'left';
		ctx.fillText(`${this.cityBonusScore}`, (ctx.canvas.width / 2) - 150, ctx.canvas.height / 2);
		ctx.fillText(`${this.missileBonusScore}`, (ctx.canvas.width / 2) - 150, ctx.canvas.height / 2 + 40);
		ctx.save();
		ctx.translate(0, ctx.canvas.height);
  	ctx.scale(1, -1);
	}

	drawLandscape(ctx) {
		ctx.drawImage(this.game.landscapeImage, 0, 0);
	}

	drawMissileIndicators(ctx) {
		for (let i = 0; i < this.game.launchpads.length; i++) {
				this.game.launchpads[i].drawMissileIndicators(ctx);		
		}
	}

}