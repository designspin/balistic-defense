import GameEngine from '../lib/GameEngine';
import FSM from 'javascript-state-machine';

import TitleScene from './scene/TitleScene';
import PlayScene from './scene/PlayScene';
import LevelUpScene from './scene/LevelUpScene';
import LevelOverScene from './scene/LevelOverScene';

class BalisticDefence extends GameEngine {
	constructor() {
		super();
		this.ctx = null;
		this.scene = null;
		this.showOutlines = true;
		this.wave = 0;
		this.cities = {qty: 6, info:[]};
		this.missilesInPlay = 0;
		this.speedMultiplier = false;
		this.landscapeImage = null;
		this.launchpads = [];
	}

	init(ctx) {
		super.init(ctx);
		this.startup(); // Fire FSM startup event;
	}

	start() {
		super.start();
	}

	////////////////////////////
	// State machine handlers //
	////////////////////////////

	onentertitle() {
		this.scene = new TitleScene(this);
		this.start();
	}

	onenterlevelinfo() {
		this.wave += 1;
		this.scene = new LevelUpScene(this, this.wave);
	}

	onenterplaying() {
		this.scene = new PlayScene(this, this.wave, this.cities)
	}

	onenterlevelcomplete() {
		this.scene = new LevelOverScene(this);
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
			game.drawScene(this.ctx);
		});
	}

	//Draw function for title screen
	drawScene(ctx) {
		this.scene.draw(ctx);
	}
}

FSM.create({
	target: BalisticDefence.prototype,
	events: [
		{name: 'startup', from: 'none', to: 'title'},
		{name: 'levelup', from: 'title', to: 'levelinfo'},
		{name: 'startgame', from: 'levelinfo', to: 'playing'},
		{name: 'levelover', from: 'playing', to: 'levelcomplete'}
	]
});

export default BalisticDefence;
