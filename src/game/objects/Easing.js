export const Easing = {
	easeInCubic: function(time,start,end,duration) {
		return end*(time/=duration)*time*time+start;
	}
}