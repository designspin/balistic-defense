export default class {
	constructor(game) {
		this.game = game;
		this.game.ASSET_MANAGER.queueDownload('images/City.png');
		this.game.ASSET_MANAGER.queueDownload('images/missile-indicator.png');
		this.init();
	}

	init() {
		this.game.ASSET_MANAGER.downloadAll(() => {
			console.log("Loaded callback!");
			this.game.gameloaded();
		});
	}

	update() {
	}

	draw(ctx) {
		ctx.restore();
		ctx.strokeStyle = '#ffffff';
		ctx.fillStyle = '#ffffff';
		ctx.lineWidth = 1;
		ctx.textBaseline = 'middle';
		ctx.textAlign = 'center';
		ctx.font = '40px Arial';
		ctx.strokeText('LOADING', ctx.canvas.width / 2, ctx.canvas.height / 2 - 20);
	}
}