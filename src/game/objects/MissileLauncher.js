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

	drawMissileIndicators(ctx) {		
		if(this.missiles < 4 && this.missiles > 0) {
			ctx.restore();
      ctx.fillStyle = "#0000FF";
      ctx.font = "10px Arial";
      ctx.textAlign = 'center';
      ctx.fillText("LOW", this.x, -this.y + ctx.canvas.height+20);
      ctx.save();
      ctx.translate(0, ctx.canvas.height);
  		ctx.scale(1, -1);
		}
		
		if (this.missiles < 1) {
			ctx.restore();
    	ctx.fillStyle = "#0000FF";
    	ctx.font = "10px Arial";
    	ctx.textAlign = 'center';
    	ctx.fillText("OUT", this.x, -this.y + ctx.canvas.height+20);
    	ctx.save();
    	ctx.translate(0, ctx.canvas.height);
    	ctx.scale(1, -1);
		}

		
		for(let m = 0; m < this.missiles; m++) {

			ctx.strokeStyle = "#ff0000";
      ctx.lineWidth = 2;
			ctx.beginPath();

			if(m === 0) {
        ctx.moveTo(this.x, this.y-2);
        ctx.lineTo(this.x, this.y-7);
      }
      if(m === 1) {
        ctx.moveTo(this.x-2, this.y-9);
        ctx.lineTo(this.x-2, this.y-14);
      }
      if(m === 2) {
        ctx.moveTo(this.x+2, this.y-9);
        ctx.lineTo(this.x+2, this.y-14);
      }
      if(m === 3) {
        ctx.moveTo(this.x-4, this.y-16);
        ctx.lineTo(this.x-4, this.y-21);
      }
      if(m === 4) {
        ctx.moveTo(this.x, this.y-16);
        ctx.lineTo(this.x, this.y-21);
      }
      if(m === 5) {
        ctx.moveTo(this.x+4, this.y-16);
        ctx.lineTo(this.x+4, this.y-21);
      }
      if(m === 6) {
        ctx.moveTo(this.x-6, this.y-23);
        ctx.lineTo(this.x-6, this.y-28);
      }
      if(m === 7) {
        ctx.moveTo(this.x-2, this.y-23);
        ctx.lineTo(this.x-2, this.y-28);
      }
      if(m === 8) {
        ctx.moveTo(this.x+2, this.y-23);
        ctx.lineTo(this.x+2, this.y-28);
      }
      if(m === 9) {
        ctx.moveTo(this.x+6, this.y-23);
        ctx.lineTo(this.x+6, this.y-28);
      }
    	ctx.stroke();
		}
	}

}
