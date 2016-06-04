import GameEngine from '../lib/GameEngine';
import FSM from 'javascript-state-machine';

class BalisticDefence extends GameEngine {
	constructor() {
		super();
	}

	init(ctx) {
		super.init(ctx);
		this.startup(); // Required by statemachine
	}

	start() {
		super.start();
	}

	//State machine handlers
	onentermenu() {
		this.start();
	}

	update() {
		switch (this.current) {
			case 'menu':
				this.updateMenu();
				break;
		}
	}

	updateMenu() {
		if(this.click) {
			this.click = null;
			this.play();
		}
	}

	draw() {
		super.draw((game) => {
			switch(this.current) {
				case 'menu':
					game.drawMenu(this.ctx);
					break;
			}
		});
	}

	drawMenu(ctx) {
		ctx.restore();
		ctx.strokeStyle = '#ffffff';
		ctx.fillStyle = '#ffffff';
		ctx.lineWidth = 2;
		ctx.textBaseline = 'middle';
		ctx.textAlign = 'center';
		ctx.font = '40px Arial';
		ctx.strokeText('BalisticDefense', ctx.canvas.width / 2, ctx.canvas.height / 2 - 20);
		ctx.font = '20px Arial';
		ctx.fillText('click or touch to start', ctx.canvas.width / 2, ctx.canvas.height / 2 + 20);
	}
}

FSM.create({
	target: BalisticDefence.prototype,
	events: [
		{name: 'startup', from: 'none', to: 'menu'}
	]
});

console.log(BalisticDefence);
export default BalisticDefence;
