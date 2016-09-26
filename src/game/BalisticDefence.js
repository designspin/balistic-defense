import GameEngine from '../lib/GameEngine';
import AssetManager from '../lib/AssetManager';
import AudioPlayer from '../lib/AudioPlayer';
import FSM from 'javascript-state-machine';
import PubSub from '../lib/PubSub';

import ScoreBoard from './objects/ScoreBoard';
import LoadingScene from './scene/LoadingScene';
import TitleScene from './scene/TitleScene';
import PlayScene from './scene/PlayScene';
import LevelUpScene from './scene/LevelUpScene';
import LevelOverScene from './scene/LevelOverScene';
import GameOverScene from './scene/GameOverScene';
import { Events } from './objects/constants';

class BalisticDefence extends GameEngine {
	constructor() {
		super();
		this.ctx = null;
		this.scene = null;
		this.showOutlines = false;
		
		this.speedMultiplier = false;
		this.landscapeImage = null;
		this.background = null;
		this.score = null;
		this.launchpads = [];

		this.soundUnlock = false;
		this.ASSET_MANAGER = new AssetManager();
		this.audioplayer = new AudioPlayer(this.ASSET_MANAGER);

		this.reset();

		this.subscribe(Events.CITY_DESTROYED, (city) => {
			this.onCityDestroyed(city);
		});

		this.subscribe(Events.PLAYER_KILLED_ENEMY_MISSILE, () => {
			this.onPlayerKilledEnemyMissile();
		});

	}

	init(ctx) {
		super.init(ctx);
		this.score = new ScoreBoard(ctx, 'ballistic-highscore-table', 
			[
				{ name: 'JLF', score: 50000 },
				{ name: 'JLF', score: 40000 },
				{ name: 'JLF', score: 30000 },
				{ name: 'JLF', score: 20000 },
				{ name: 'JLF', score: 10000 },
				{ name: 'JLF', score: 5000 },
				{ name: 'JLF', score: 1000 },
				{ name: 'JLF', score: 500 }
			]
		);
		this.setUpCities();
		this.landscapeImage = this.cachedLandscape();
		this.background = this.cacheBackgroundImage();
		this.startup(); // Fire FSM startup event;
	}

	start() {
		super.start();
	}

	reset() {
		this.entities = [];
		this.wave = 0;
		this.cities = {qty: 6, info:[]};
		this.missilesInPlay = 0;	
	}

	setUpCities() {
		let  step = (this.ctx.canvas.width - 160) / 6
		let cityPosX = 50 + (step/2);

		for(let i = 0; i < this.cities.qty; i++) {
			this.cities.info.push({x: cityPosX, y: 26, isAlive: true, instance: null });

			if ( i + 1 == 3) {
				cityPosX = cityPosX + 60;
			}

			cityPosX = cityPosX + step;
		}
	}
	////////////////////////////
	// State machine handlers //
	////////////////////////////
	// Event Handles

	onafterlevelreset() {
		this.reset();
		this.setUpCities();
		this.score.reset();
	}
	// State Handles
	onenterloading() {
		this.scene = new LoadingScene(this);
		this.start();
	}

	onentertitle() {
		this.scene = new TitleScene(this);
	}

	onenterlevelinfo() {
		this.wave += 1;
		this.scene = new LevelUpScene(this, this.wave);
	}

	onenterplaying() {
		this.scene = new PlayScene(this, this.wave, this.cities)
	}

	onenterlevelcomplete() {
		if (this.cities.qty < 1) {
			this.scene = new GameOverScene(this);
		} else {
			this.scene = new LevelOverScene(this);
		}
	}
	////////////////////////////
	//  PubSub handlers 			//
	////////////////////////////
	onCityDestroyed(city) {
		this.cities.qty -= 1;
		this.cities.info[city.position].isAlive = false;

		if(this.cities.qty < 1) {
			this.speedMultiplier = true;
		}
	}

	onPlayerKilledEnemyMissile() {
		this.score.add(100);
	}
	////////////////////////////
	// Update                 //
	////////////////////////////

	update() {
		this.updateScene();
		super.update();
	}

	//Update function for title screen
	updateScene() {
		this.scene.update();
	}

	////////////////////////////
	// Draw                   //
	////////////////////////////

	draw() {
		super.draw((game) => {
			this.ctx.drawImage(this.background, 0, 0);
			
			//this.ctx.drawImage(this.landscapeImage, 0, 0);
			game.drawScene(this.ctx);
			
		});
	}

	//Draw function for title screen
	drawScene(ctx) {
		this.scene.draw(ctx);
	}

	cacheBackgroundImage() {
		const offscreencanvas = document.createElement('canvas');
		offscreencanvas.width = this.ctx.canvas.width;
		offscreencanvas.height = this.ctx.canvas.height;
		const offctx = offscreencanvas.getContext('2d');

		// Create gradient
      let grd = offctx.createLinearGradient(0, this.ctx.canvas.height, 0, 0);
      // Add colors
      grd.addColorStop(0.000, 'rgba(0, 0, 255, 1.000)');
      grd.addColorStop(1.000, 'rgba(0, 255, 255, 1.000)');
      offctx.fillStyle = grd;
      offctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
      offctx.drawImage(this.landscapeImage, 0, 0);
      return offscreencanvas;
	}

	//Cahed landscape image
	cachedLandscape() {
		const platformWidth = 40;
		const platformIncline = 10;
		const platformHeight = 40;
		const groundLevel = 10;

		const offscreencanvas = document.createElement('canvas');
		const offscreenctx = offscreencanvas.getContext('2d');
		
		offscreencanvas.width = this.ctx.canvas.width;
		offscreencanvas.height = platformHeight;

		const landscapeDistance = (offscreenctx.canvas.width - (platformWidth * 3) - (platformIncline * 4))/2;

		offscreenctx.save();
		 // Create gradient
      let grd = offscreenctx.createLinearGradient(0, 0, offscreenctx.canvas.width, offscreenctx.canvas.height);
      
      // Add colors
       grd.addColorStop(0.000, 'rgba(0, 127, 63, 1.000)');
      grd.addColorStop(0.500, 'rgba(95, 191, 0, 1.000)');
      grd.addColorStop(1.000, 'rgba(0, 127, 63, 1.000)');
	  offscreenctx.fillStyle = grd;
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

FSM.create({
	target: BalisticDefence.prototype,
	events: [
		{name: 'startup', from: 'none', to: 'loading'},
		{name: 'gameloaded', from: 'loading', to: 'title' },
		{name: 'levelup', from: ['title', 'levelcomplete'], to: 'levelinfo'},
		{name: 'startgame', from: 'levelinfo', to: 'playing'},
		{name: 'levelover', from: 'playing', to: 'levelcomplete'},
		{name: 'levelreset', from: 'levelcomplete', to: 'title'}
	]
});

PubSub.activate(BalisticDefence.prototype);

export default BalisticDefence;
