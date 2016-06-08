import MissileLauncher from '../objects/MissileLauncher';

import City from '../entities/City';
import PlayerMissile from '../entities/PlayerMissile';
import EnemyMissile from '../entities/EnemyMissile';

export default class {
	constructor(game, wave) {

		this.game = game;
		
		this.wave = wave;

		this.maxMissilesInPlay = null;
		this.timeBetweenRelease = null;
		this.maxMissileRelease = null;
		this.missilesToRelease = null;
		this.launchSpeed = null;

		this.setupLevel(this.wave);

		this.game.landscapeImage = this.cachedLandscape();
		this.game.launchpads = [];
		this.timer = 0;
		//Setup launchpads
		this.game.launchpads[0] = new MissileLauncher(20, 30);
		this.game.launchpads[1] = new MissileLauncher(this.game.ctx.canvas.width / 2, 30);
		this.game.launchpads[2] = new MissileLauncher(this.game.ctx.canvas.width - 20, 30);

		//Setup cities
    	for(let i = 0; i < this.game.cities.info.length; i++) {
    		console.log(this.game.cities.info[i].isAlive);
    		if(this.game.cities.info[i].isAlive) {
    			let city = this.game.cities.info[i];
    			city.instance = new City(this.game, city.x, city.y, i)
    			this.game.addEntity(city.instance);
    		}
    	}	
  	}

	setupLevel(wave) {
		this.maxMissilesInPlay  = [8  ,8  ,8  ,8  ,10  ,10  ,10  ,10  ,12 ,12 ,12 ,12 ,14  ,14  ,14  ,14  ,16  ,16  ,16  ,16][wave-1];
		this.timeBetweenRelease = [3  ,3  ,3  ,3  ,2.5 ,2.5 ,2.5 ,2.5 ,2  ,2  ,2  ,2  ,1.5 ,1.5 ,1.5 ,1.5 ,1   ,1   ,1   ,1 ][wave-1];
		this.maxMissileRelease  = [4  ,4  ,4  ,4  ,6   ,6   ,6   ,6   ,8  ,8  ,8  ,8  ,8   ,8   ,8   ,8   ,8   ,8   ,8   ,8 ][wave-1];
		this.missilesToRelease  = [18 ,18 ,18 ,18 ,22  ,22  ,22  ,22  ,24 ,24 ,24 ,24 ,26  ,26  ,26  ,26  ,28  ,28  ,30  ,30][wave-1];
		this.launchSpeed		= [20 ,25 ,30 ,35 ,40  ,45  ,50  ,55  ,60 ,65 ,70 ,75 ,80  ,85  ,90  ,95  ,100 ,105 ,110 ,120][wave-1];
	}

	update() {
		this.timer += this.game.clockTick;
		if(this.game.click) {
			this.launchPlayerMissile();
		}
		
		//Launch some missiles
		if (this.timer > this.timeBetweenRelease && this.missilesToRelease > 0) {
			this.timer = 0;
			let launchQuantity = this.maxMissilesInPlay - this.game.missilesInPlay;
			launchQuantity = (launchQuantity > this.maxMissileRelease) ? this.maxMissileRelease : (launchQuantity < this.missilesToRelease ? launchQuantity : this.missilesToRelease);

			this.missilesToRelease -= launchQuantity;

			for(let i = 0; i < launchQuantity; i++) {
				this.game.missilesInPlay += 1;
				var enemyMissile = new EnemyMissile(this.game, Math.floor(Math.random() * 480) +1, 10,  Math.floor(Math.random() * 480) +1, 320, this.launchSpeed);
      			this.game.addEntity(enemyMissile);
			}
			
		}

		//Run out of missiles
		if(this.game.launchpads[0].missiles < 1 && this.game.launchpads[1].missiles < 1 && this.game.launchpads[2].missiles < 1) {
			this.missilesToRelease = 0;
			this.game.speedMultiplier = true;
		}


		//No entities on screen apart from cities and wave over or missiles used
		if(this.game.speedMultiplier || this.missilesToRelease < 1) {
			let complete = false;

			if(this.game.entities.length) {
				for(let k = 0; k < this.game.entities.length; k++) {
					console.log("Object is City: ", this.game.entities[k] instanceof City);
					if(this.game.entities[k] instanceof City) {
						complete = true;
					} else {
						complete = false;
					}
				}
			} else {
				complete = true;
			}
			console.log("Complete: ", complete);
			if(complete) {
				console.log("Complete!");
				this.game.levelover(this.game, this.landscapeImage, this.launchpads);
			}
		}
	}

	draw(ctx) {
		this.drawLandscape(ctx);
		this.drawMissileIndicators(ctx);
	}

	drawLandscape(ctx) {
		ctx.drawImage(this.game.landscapeImage, 0, 0);
	}

	drawMissileIndicators(ctx) {
		for (let i = 0; i < this.game.launchpads.length; i++) {
				this.game.launchpads[i].drawMissileIndicators(ctx);		
		}
	}

	launchPlayerMissile() {
		let launcherIndex = null,
				distance = null,
				missile = null,
				click = this.game.click,
				canvas = this.game.ctx.canvas;

		for (let i = 0; i < this.game.launchpads.length; i++) {
			let currentDistance = this.game.launchpads[i].getDistance(click.x, click.y, this.game.scale)

			if((currentDistance < distance || distance === null) && this.game.launchpads[i].missiles > 0) {
				distance = currentDistance;
				launcherIndex = i;
			}
		}

		if(distance != null) {
			this.game.launchpads[launcherIndex].missiles -= 1;
			missile = new PlayerMissile(this.game, (click.x / this.game.scale), canvas.height - (click.y / this.game.scale), this.game.launchpads[launcherIndex].x, this.game.launchpads[launcherIndex].y);
			this.game.addEntity(missile);
		}
	}

	//Cahed landscape image
	cachedLandscape() {
		const platformWidth = 40;
		const platformIncline = 10;
		const platformHeight = 30;
		const groundLevel = 10;

		const offscreencanvas = document.createElement('canvas');
		const offscreenctx = offscreencanvas.getContext('2d');
		
		offscreencanvas.width = this.game.ctx.canvas.width;
		offscreencanvas.height = platformHeight;

		const landscapeDistance = (offscreenctx.canvas.width - (platformWidth * 3) - (platformIncline * 4))/2;

		offscreenctx.save();
	  offscreenctx.fillStyle = "#ffff00";
	  offscreenctx.beginPath();
	  offscreenctx.moveTo(0,platformHeight);
	  offscreenctx.lineTo(platformWidth, platformHeight);
	  offscreenctx.lineTo(platformWidth + platformIncline, groundLevel);
	  offscreenctx.lineTo(platformWidth + platformIncline + landscapeDistance, groundLevel);
	  offscreenctx.lineTo(platformWidth + (platformIncline * 2) + landscapeDistance, platformHeight);
	  offscreenctx.lineTo((platformWidth * 2) + (platformIncline * 2) + landscapeDistance, platformHeight);
	  offscreenctx.lineTo((platformWidth * 2) + (platformIncline * 3) + landscapeDistance, groundLevel);
	  offscreenctx.lineTo((platformWidth * 2) + (platformIncline * 3) + (landscapeDistance * 2), groundLevel);
	  offscreenctx.lineTo((platformWidth * 2) + (platformIncline * 4) + (landscapeDistance * 2), platformHeight);
	  offscreenctx.lineTo((platformWidth * 3) + (platformIncline * 4) + (landscapeDistance * 2), platformHeight);
	  offscreenctx.lineTo((platformWidth * 3) + (platformIncline * 4) + (landscapeDistance * 2), 0);
	  offscreenctx.lineTo(0,0);
	  offscreenctx.fill();
	  offscreenctx.restore();

	  return offscreencanvas;
	}
}