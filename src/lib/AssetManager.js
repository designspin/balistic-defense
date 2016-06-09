export default class {
	constructor() {
		console.log("Asset!");
		this.successCount = 0;
		this.errorCount = 0;
		this.cache = {};
		this.downloadQueue = [];
		this.soundsQueue = [];
	}

	queueDownload(path) {
		this.downloadQueue.push(path);
	}

	downloadAll(downloadCallback) {
		if(this.downloadQueue.length === 0) {
			downloadCallback();
		}

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

	getAsset(path) {
		return this.cache[path];
	}

	isDone() {
		return (this.downloadQueue.length === this.successCount + this.errorCount);
	}


}