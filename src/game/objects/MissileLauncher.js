export default class {
	constructor(x, y) {
		this.x = x;
		this.y = y;
		this.missiles = 10;
	}

	getDistance(targetX, targetY, scale) {
		const a = (targetX / scale) - this.x;
    const b = (targetY / scale) - this.y;
    const length = Math.sqrt((a * a) + (b * b));

    return length;
	}
}