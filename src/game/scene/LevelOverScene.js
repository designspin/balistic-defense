import City from '../entities/City';

export default class {
	constructor(game) {
		this.game = game;

		this.timer = 0;
		this.updateInterval = 0.5;

		this.bonusHandler = ['cities', 'missiles', 'finished'];
		this.currentHandler = 0;

		this.cityBonusScore = 0;
		this.missileBonusScore = 0;

		this.citiesSurvived = [];
		this.cityIndicators = [];

		this.setupCitiesSurvived();
	}

	setupCitiesSurvived() {
		let cities = this.game.cities.info;
		let xPos = -85;


		for(let city = 0; city < cities.length; city++) {
			if (cities[city].isAlive) {
				this.citiesSurvived.push({x: (this.game.ctx.canvas.width / 2) + xPos , y: this.game.ctx.canvas.height / 2, original: cities[city].instance });
				xPos += 47;
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
						this.citiesSurvived[0].original.removeFromWorld = true;
						this.cityIndicators.push(new City(this.game, this.citiesSurvived[0].x, this.citiesSurvived[0].y));
						this.game.addEntity(this.cityIndicators[this.cityIndicators.length-1]);
						this.citiesSurvived.shift();
						this.cityBonusScore += 100;
					} else {
						this.currentHandler += 1;
						this.updateInterval = 0.05;
					}
					break;
				case 'missiles':
					if(this.game.launchpads[0].missiles > 0) {
						this.game.launchpads[0].missiles -= 1;
						console.log("Pad 1: ", this.game.launchpads[0].missiles);
						this.missileBonusScore += 5;
					} else if(this.game.launchpads[1].missiles > 0) {
						this.game.launchpads[1].missiles -= 1;
						console.log("Pad 2: ", this.game.launchpads[1].missiles);
						this.missileBonusScore += 5;
					} else if(this.game.launchpads[2].missiles > 0) {
						this.game.launchpads[2].missiles -= 1;
						this.missileBonusScore += 5;
					} else {
					  this.updateInterval = 3;
					  this.currentHandler += 1;
					}
					
					break;
				case 'finished':
					for(let i = 0; i < this.cityIndicators.length; i++) {
						this.cityIndicators[i].removeFromWorld = true;
					}
					this.game.levelup();
					break;
			}

		}
	}

	draw(ctx) {
		this.drawLandscape(ctx);
		this.drawMissileIndicators(ctx);
		
		ctx.restore();
		ctx.strokeStyle = '#ffffff';
		ctx.fillStyle = '#000000';
		ctx.lineWidth = 1;
		ctx.textBaseline = 'middle';
		ctx.textAlign = 'center';
		ctx.font = '40px Arial';
		ctx.fillText(`Wave ${this.game.wave} Complete`, ctx.canvas.width / 2, ctx.canvas.height / 2 - 100);
		ctx.strokeText(`Wave ${this.game.wave} Complete`, ctx.canvas.width / 2, ctx.canvas.height / 2 - 100);
		ctx.font = '20px Arial';
		ctx.fillStyle = '#ffffff';
		ctx.fillText('Bonus',  ctx.canvas.width / 2, ctx.canvas.height / 2 - 50);
		ctx.fillStyle = '#ffff00';
		ctx.textAlign = 'left';
		ctx.fillText(`${this.cityBonusScore}`, (ctx.canvas.width / 2) - 165, ctx.canvas.height / 2 + 3);
		ctx.fillText(`${this.missileBonusScore}`, (ctx.canvas.width / 2) - 165, ctx.canvas.height / 2 + 40);

		if(this.missileBonusScore > 0) {
			let xPos = -97;
			for (let i = 0; i < this.missileBonusScore / 5; i++) {
				ctx.strokeStyle = "#ff0000";
				ctx.lineWidth = 5;
				ctx.beginPath();
				ctx.moveTo((this.game.ctx.canvas.width / 2) + xPos, (this.game.ctx.canvas.height / 2 + 40) - 12);
				ctx.lineTo((this.game.ctx.canvas.width / 2) + xPos, (this.game.ctx.canvas.height / 2 + 40) + 12);
				ctx.stroke();
				xPos += 9;
			}
		}

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