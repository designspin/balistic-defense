export default class {
	constructor() {
		this.gameTime = 0;
		this.maxStep = 0.05;
		this.wallLastTimestamp = 0;
		this.fps = 0;
	}

	tick() {
		const wallCurrent = Date.now();
		let wallDelta = (wallCurrent - this.wallLastTimestamp) / 1000;

		this.fps = 1000 / (wallCurrent - this.wallLastTimestamp);
		this.wallLastTimestamp = wallCurrent;
		var gameDelta = Math.min(wallDelta, this.maxStep);

		this.gameTime += gameDelta;

		return gameDelta;
	}
}