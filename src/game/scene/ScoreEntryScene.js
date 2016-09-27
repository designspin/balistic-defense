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
					this.entry += btn.label;
				}
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
		ctx.font = "24px Arial";
		ctx.textAlign = 'center';
		ctx.fillText(this.entry, ctx.canvas.width / 2, 30);
		for( let i = 0; i < this.buttons.length; i++ ) {
			let btn = this.buttons[i];
			ctx.beginPath();
			ctx.rect(btn.x1, btn.y1, btn.width, btn.height);
			ctx.stroke();
			ctx.font = "16px Arial";
			ctx.fillText(btn.label, btn.x1 + btn.width / 2, btn.y1 + btn.height / 2);
		}
		ctx.restore();
	}
}