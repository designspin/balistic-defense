export default {
	easeInCubic: function(time,start,end,duration) {
		return end*(time/=duration)*time*time+start;
	},
	easeInCirc: function (t, b, c, d) {
		t /= d;
		return -c * (Math.sqrt(1 - t*t) - 1) + b;
	},
	easeInQuad: function (t, b, c, d) {
		t /= d;
		return c*t*t + b;
	},
	easeInOutQuad: function (t, b, c, d) {
		t /= d/2;
		if (t < 1) return c/2*t*t + b;
		t--;
		return -c/2 * (t*(t-2) - 1) + b;
	},
	easeInSine: function (t, b, c, d) {
		return -c * Math.cos(t/d * (Math.PI/2)) + c + b;
	},
	easeInOutSine: function (t, b, c, d) {
		return -c/2 * (Math.cos(Math.PI*t/d) - 1) + b;
	}	
}