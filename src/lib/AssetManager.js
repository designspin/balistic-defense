export default class {
	constructor() {
		this.successCount = 0;
		this.errorCount = 0;
		this.cache = {};
		this.downloadQueue = [];
		this.soundsQueue = [];
	}

	queueDownload(path) {
		this.downloadQueue.push(path);
	}

	queueSound(id, path) {
		this.soundsQueue.push({id: id, path: path});
	}

	downloadAll(downloadCallback) {
		if(this.downloadQueue.length === 0) {
			downloadCallback();
		}

		this.downloadSounds(downloadCallback);

		for(let i = 0; i < this.downloadQueue.length; i++) {

			const path = this.downloadQueue[i];
			let img = new Image();

			img.addEventListener("load", () => {
				this.successCount += 1;
				if(this.isDone()) {
					downloadCallback();
				}
			}, false);

			img.addEventListener("error", () => {
				this.errorCount += 1;
				if(this.isDone()) {
					downloadCallback();
				}
			}, false);

			img.src = path;
			this.cache[path] = img;
		}
	}

	downloadSounds(downloadCallback) {
		
		let AudioContext = window.AudioContext || window.webkitAudioContext;
		let audioctx = new AudioContext();

		for(let i = 0; i < this.soundsQueue.length; i++) {
			let id = this.soundsQueue[i].id;
			let request = new XMLHttpRequest();
			request.open('get', this.soundsQueue[i].path, true);
			request.responseType = 'arraybuffer';
			request.onload = () => {
				audioctx.decodeAudioData(request.response, (buffer) => {
					
					this.successCount += 1;
					this.cache[id] = buffer;
					if(this.isDone()) {
						downloadCallback();
					}
				});
			}
			request.onerror = () => {
				this.errorCount += 1;
				if(this.isDone()) {
					downloadCallback();
				}
			}
			request.send();
		}
	}

	getAsset(path) {
		return this.cache[path];
	}

	isDone() {
		return ((this.downloadQueue.length + this.soundsQueue.length) === this.successCount + this.errorCount);
	}


}