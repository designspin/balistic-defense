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
		// create empty buffer
		let buffer = this.audioctx.createBuffer(1, 1, 22050);
		let source = this.audioctx.createBufferSource();
		source.buffer = buffer;

		// connect to output (your speakers)
		source.connect(this.audioctx.destination);

		// play the file
		source.noteOn(0);
	}

	play(id) {

		let sound = this.audioctx.createBufferSource();
		sound.buffer = this.buffers[id];
		sound.connect(this.audioctx.destination);
		sound.start(this.audioctx.currentTime);
		sound.stop(this.audioctx.currentTime + this.buffers[id].duration);

		/*this.buffers[prop] = this.audioctx.createBufferSource();
		this.buffers[prop].buffer = this.asset_manager.cache[prop];
		this.buffers[prop].connect(this.audioctx.destination);
		this.buffers[id].stop();
		this.buffers[id].start(this.audioctx.currentTime);*/
	}
}