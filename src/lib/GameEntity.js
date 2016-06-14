export default class {
	constructor(game, x, y) {
		this.game = game;
		this.x = x;
		this.y = y;
		this.removeFromWorld = false;
	}

	update() {
	}

	draw(ctx) {
		if (this.game.showOutlines && this.radius) {
	        ctx.beginPath();
	        ctx.strokeStyle = "red";
	        ctx.lineWidth = 1;
	        ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2, false);
	        ctx.stroke();
	        ctx.closePath();
    	}

    	if (this.game.showOutlines && this.hitBox) {
    		ctx.strokeStyle = "red";
    		ctx.lineWidth = 1;
    		ctx.rect(this.hitBox.x, this.hitBox.y, this.hitBox.width, this.hitBox.height);
    		ctx.stroke();
    	}

    	if (this.game.showOutlines && this.hitTriangle) {
    		ctx.strokeStyle = "red";
    		ctx.lineWidth = 2;
    		ctx.beginPath();
    		ctx.moveTo(this.hitTriangle.p1.x, this.hitTriangle.p1.y);
    		ctx.lineTo(this.hitTriangle.p2.x, this.hitTriangle.p2.y);
    		ctx.lineTo(this.hitTriangle.p3.x, this.hitTriangle.p3.y);
    		ctx.closePath();
    		ctx.stroke();
    	}
	}
}