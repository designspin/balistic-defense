export default class {
	constructor(assets_manager) {
		let AudioContext = window.AudioContext || window.webkitAudioContext;

		this.asset_manager = assets_manager;
		this.audioctx = new AudioContext();
		this.buffers = {};
	}

	init() {
		for(let prop in this.asset_manager.cache) {
			if(this.asset_manager.cache[prop] instanceof AudioBuffer) {
				this.buffers[prop] = this.asset_manager.cache[prop];
			}
		}
	}

	unlock() {
		// Enable audio in iOS
		let buffer = this.audioctx.createBuffer(1, 1, 22050);
		let source = this.audioctx.createBufferSource();
		source.buffer = buffer;

		source.connect(this.audioctx.destination);

		source.noteOn(0);
	}

	play(id) {

		let sound = this.audioctx.createBufferSource();
		sound.buffer = this.buffers[id];
		sound.connect(this.audioctx.destination);
		sound.start(this.audioctx.currentTime);
		sound.stop(this.audioctx.currentTime + this.buffers[id].duration);
	}
}