import Easing from '../objects/Easing';

export default class {
	constructor(game) {
		this.game = game;
		this.characters = [
			'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 
			'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P',
			'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X',
			'Y', 'Z', '.', ' ', 'DEL', 'END'
		];
		this.buttons = [];
		this.entry = '';
		this.entryAllowed = true;
		this.init();
	}

	init() {
		let i, j, temp, chunk = 8, row = 0;
		let xOffset = (this.game.ctx.canvas.width - (46 * 8)) / 2;
		let yOffset = (this.game.ctx.canvas.height - (46 * 4)) / 2;

		for( i = 0, j = this.characters.length; i < j; i += chunk) {
			temp = this.characters.slice(i, i+chunk);

			for(let k = 0; k < temp.length; k++) {
				this.buttons.push({
					x1: k * 46 + xOffset,
					y1: row * 46  + (yOffset * 1.5),
					width: 46,
					height: 46,
					pressed: false,
					fillOpacity: 0,
					timer: 0,
					label: temp[k]
				});
			}
			row+=1;
		}
	}

	update() {
		if(this.game.click) {
			let click = this.game.click;
			let scale = this.game.scale;

			for(let i = 0; i < this.buttons.length; i++) {
				let btn = this.buttons[i];

				if(click.x / scale >= btn.x1 && 
					click.x / scale <= btn.x1 + btn.width && 
					click.y / scale >= btn.y1 && 
					click.y / scale <= btn.y1 + btn.height) {
					btn.pressed = true;
					btn.timer = 0;
					this.updateEntry(btn.label);
				}
			}
		}

		for(let i = 0; i < this.buttons.length; i++) {
			let btn = this.buttons[i];

			if (btn.pressed) {
				
				btn.fillOpacity = 1 - (Easing.easeOutQuad(btn.timer, 0, 1, 1.5));
				btn.timer += this.game.clockTick;
				if(btn.timer > 1.5) {
					btn.timer = 0;
					btn.pressed = false;
					btn.fillOpacity = 0;
				}
			}
		}
	}

	updateEntry(char) {
		switch(char) {
			case 'DEL':
				this.entry = this.entry.slice(0, -1);
				this.entryAllowed = true;
				break;
			case 'END':
				this.game.score.addHighScore(this.entry);
				this.game.levelreset();
				break;
			default:
				if(this.entry.length < 10) {
					this.entry += char;
					this.entryAllowed = (this.entry.length < 10) ? true : false;
				} 
		}
	}

	draw(ctx) {
		ctx.save();
		ctx.translate(0, ctx.canvas.height);
		ctx.scale(1, -1);

		ctx.fillStyle = "#fff";
		ctx.strokeStyle = "#fff";
		ctx.lineWidth = 1;
		ctx.font = "16px Arial";
		ctx.textAlign = 'center';
		ctx.fillText('Top Defending, Enter Your Name!', ctx.canvas.width / 2, 30);
		ctx.font = "24px Arial";
		ctx.textAlign = 'center';
		ctx.fillText(this.entry, ctx.canvas.width / 2, 60);
		for( let i = 0; i < this.buttons.length; i++ ) {
			let btn = this.buttons[i];
			ctx.beginPath();
			ctx.fillStyle = `rgba(255, 255, 255, ${btn.fillOpacity})`;
			ctx.rect(btn.x1, btn.y1, btn.width, btn.height);
			ctx.fill();
			ctx.stroke();

			if(this.entryAllowed || (btn.label == 'DEL' || btn.label == 'END')) {
				ctx.font = "16px Arial";
				ctx.fillStyle = "#fff";
				ctx.fillText(btn.label, btn.x1 + btn.width / 2, btn.y1 + btn.height / 2);
			}
		}
		ctx.restore();
	}
}