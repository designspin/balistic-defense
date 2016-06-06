import GameEngine from '../lib/GameEngine';
import FSM from 'javascript-state-machine';

import MissileLauncher from './objects/MissileLauncher';

import City from './entities/City';
import PlayerMissile from './entities/PlayerMissile';
import EnemyMissile from './entities/EnemyMissile';

class BalisticDefence extends GameEngine {
	constructor() {
		super();
		this.ctx = null;
		this.wave = 0;
	}

	init(ctx) {
		super.init(ctx);
		this.ctx = ctx;

		this.landscapeImage = this.cachedLandscape();
		this.launchpads = [];
		this.cities = 6;

		this.startup(); // Fire FSM startup event;
	}

	start() {
		super.start();
	}

	////////////////////////////
	// State machine handlers //
	////////////////////////////

	onentermenu() {
		this.start();
	}

	onenterplaying() {
		this.wave += 1;
		//Setup launchpads
		this.launchpads[0] = new MissileLauncher(20, 30);
		this.launchpads[1] = new MissileLauncher(this.ctx.canvas.width / 2, 30);
		this.launchpads[2] = new MissileLauncher(this.ctx.canvas.width - 20, 30);

		//Setup cities
		for (let i = 0; i < this.cities; i++) {
			let cityPosX = ((i+1) * 57) + 16;

	    if (i + 1 > 3) {
	    	cityPosX = ((i+1) * 57) + 66;
	    }

    	this.addEntity(new City(this, cityPosX, 26));
  	}
	}

	////////////////////////////
	// Update                 //
	////////////////////////////

	update() {
		switch (this.current) {
			case 'menu':
				this.updateMenu();
				break;
			case 'playing':
				this.updatePlaying();
				break;
		}
		super.update();
	}

	//Update function for title screen
	updateMenu() {
		if(this.click) {
			this.click = null;
			this.startgame(); // Fire FSM startgame event;
		}
	}

	//Update function for playing
	updatePlaying() {
		if(this.click) {
			this.launchPlayerMissile();
		}

		//Temp

		let random = Math.floor(Math.random() * 70);
    if (random < this.wave) {
      var enemyMissile = new EnemyMissile(this, Math.floor(Math.random() * 480) +1, 10,  Math.floor(Math.random() * 480) +1, 320);
      this.addEntity(enemyMissile);
    }
	}

	////////////////////////////
	// Draw                   //
	////////////////////////////

	draw() {
		super.draw((game) => {
			switch(this.current) {
				case 'menu':
					game.drawMenu(this.ctx);
					break;
				case 'playing':
					game.drawPlaying(this.ctx);
					break;
			}
		});
	}

	//Draw function for title screen
	drawMenu(ctx) {
		ctx.restore();
		ctx.strokeStyle = '#ffffff';
		ctx.fillStyle = '#ffffff';
		ctx.lineWidth = 2;
		ctx.textBaseline = 'middle';
		ctx.textAlign = 'center';
		ctx.font = '40px Arial';
		ctx.strokeText('Balistic Defence', ctx.canvas.width / 2, ctx.canvas.height / 2 - 20);
		ctx.font = '20px Arial';
		ctx.fillText('click or touch to start', ctx.canvas.width / 2, ctx.canvas.height / 2 + 20);
	}

	//Draw function for playing
	drawPlaying(ctx) {
		this.drawLandscape(ctx);
		this.drawMissileIndicators(ctx);
	}

	drawLandscape(ctx) {
		ctx.drawImage(this.landscapeImage, 0, 0);
	}

	drawMissileIndicators(ctx) {
		for (let i = 0; i < this.launchpads.length; i++) {
			if(this.launchpads[i].missiles > 0) {
				for(let m = 0; m < this.launchpads[i].missiles; m++) {
					ctx.strokeStyle = "#0000ff";
					ctx.beginPath();

					if(m === 0) {
	          ctx.moveTo(this.launchpads[i].x, this.launchpads[i].y-2);
	          ctx.lineTo(this.launchpads[i].x, this.launchpads[i].y-7);
	        }
	        if(m === 1) {
	          ctx.moveTo(this.launchpads[i].x-2, this.launchpads[i].y-9);
	          ctx.lineTo(this.launchpads[i].x-2, this.launchpads[i].y-14);
	        }
	        if(m === 2) {
	          ctx.moveTo(this.launchpads[i].x+2, this.launchpads[i].y-9);
	          ctx.lineTo(this.launchpads[i].x+2, this.launchpads[i].y-14);
	        }
	        if(m === 3) {
	          ctx.moveTo(this.launchpads[i].x-4, this.launchpads[i].y-16);
	          ctx.lineTo(this.launchpads[i].x-4, this.launchpads[i].y-21);
	        }
	        if(m === 4) {
	          ctx.moveTo(this.launchpads[i].x, this.launchpads[i].y-16);
	          ctx.lineTo(this.launchpads[i].x, this.launchpads[i].y-21);
	        }
	        if(m === 5) {
	          ctx.moveTo(this.launchpads[i].x+4, this.launchpads[i].y-16);
	          ctx.lineTo(this.launchpads[i].x+4, this.launchpads[i].y-21);
	        }
	        if(m === 6) {
	          ctx.moveTo(this.launchpads[i].x-6, this.launchpads[i].y-23);
	          ctx.lineTo(this.launchpads[i].x-6, this.launchpads[i].y-28);
	        }
	        if(m === 7) {
	          ctx.moveTo(this.launchpads[i].x-2, this.launchpads[i].y-23);
	          ctx.lineTo(this.launchpads[i].x-2, this.launchpads[i].y-28);
	        }
	        if(m === 8) {
	          ctx.moveTo(this.launchpads[i].x+2, this.launchpads[i].y-23);
	          ctx.lineTo(this.launchpads[i].x+2, this.launchpads[i].y-28);
	        }
	        if(m === 9) {
	          ctx.moveTo(this.launchpads[i].x+6, this.launchpads[i].y-23);
	          ctx.lineTo(this.launchpads[i].x+6, this.launchpads[i].y-28);
	        }
	        ctx.stroke();
				}
			}
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
		
		offscreencanvas.width = this.ctx.canvas.width;
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

	/////////////////////////////
	// Actions								 //
	/////////////////////////////

	launchPlayerMissile() {
		let launcherIndex = null,
				distance = null,
				missile = null;

		for (let i = 0; i < this.launchpads.length; i++) {
			let currentDistance = this.launchpads[i].getDistance(this.click.x, this.click.y, this.scale)

			if((currentDistance < distance || distance === null) && this.launchpads[i].missiles > 0) {
				distance = currentDistance;
				launcherIndex = i;
			}
		}

		if(distance != null) {
			this.launchpads[launcherIndex].missiles -= 1;
			console.log("Adding missile");
			missile = new PlayerMissile(this, (this.click.x / this.scale), this.ctx.canvas.height - (this.click.y / this.scale), this.launchpads[launcherIndex].x, this.launchpads[launcherIndex].y);
			this.addEntity(missile);
		}
	}
}

FSM.create({
	target: BalisticDefence.prototype,
	events: [
		{name: 'startup', from: 'none', to: 'menu'},
		{name: 'startgame', from: 'menu', to: 'playing'}
	]
});

export default BalisticDefence;
