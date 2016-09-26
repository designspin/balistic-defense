export default class {
	constructor(game) {
		this.game = game;
		this.game.ASSET_MANAGER.queueDownload('images/City.png');
		this.game.ASSET_MANAGER.queueDownload('images/missile-indicator.png');
		this.game.ASSET_MANAGER.queueSound('explosion', 'sounds/8-bit-explosion.wav');
		this.game.ASSET_MANAGER.queueSound('launch', 'sounds/launch-sound.wav');
		this.game.ASSET_MANAGER.queueSound('bullet-ping', 'sounds/bullet-left-ping.wav');
		this.game.ASSET_MANAGER.queueSound('city-ping', 'sounds/city-left-ping.wav');
		this.game.ASSET_MANAGER.queueSound('incoming', 'sounds/incoming.mp3');
		this.queued = null;
		this.loaded = 0;
		this.init();
	}

	init() {
		this.queued = this.game.ASSET_MANAGER.downloadAll(() => {
			this.game.audioplayer.init();
			this.game.gameloaded();
		}, this.itemLoaded.bind(this));
	}

	update() {
	}

	itemLoaded(queued, loaded) {
		this.loaded = loaded;
		this.queued = queued;
	}

	draw(ctx) {
		ctx.beginPath();
		ctx.strokeStyle='#000000';
		ctx.fillStyle='#000000';
		ctx.lineWidth = 1;
		ctx.rect(48, ctx.canvas.height / 2 - 22, ctx.canvas.width - 98, 14);
		ctx.stroke();
		ctx.fill();

		ctx.beginPath();
		ctx.fillStyle="#ffffff";
		ctx.rect(50, ctx.canvas.height / 2 - 20, (ctx.canvas.width - 100) / (this.queued / this.loaded), 10);
		ctx.fill();

		ctx.restore();
		ctx.strokeStyle = '#ffffff';
		ctx.fillStyle = '#000000';
		ctx.lineWidth = 1;
		ctx.textBaseline = 'middle';
		ctx.textAlign = 'center';
		ctx.font = '40px Arial';
		ctx.fillText(`LOADING`, ctx.canvas.width / 2, ctx.canvas.height / 2 - 20);
		ctx.strokeText(`LOADING`, ctx.canvas.width / 2, ctx.canvas.height / 2 - 20);
	}
}