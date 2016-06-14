import Timer from './GameTimer';

export default class {
	constructor() {
		this.entities = [];
		this.ctx = null;
		this.click = null;
		this.timer = new Timer();
		this.surfaceWidth = null;
		this.surfaceHeight = null;
		this.scale = null;
		this.clockTick = null;
	}

	init(ctx) {
		this.ctx = ctx;
		this.surfaceWidth = this.ctx.canvas.width;
		this.surfaceHeight = this.ctx.canvas.height;
		this.setSurface();
		this.startInput();
	}

	start() {
	 let gameLoop = () => {
	 	this.loop();
	 	requestAnimationFrame(gameLoop, this.ctx.canvas);
	 };
	 gameLoop();
	}

	setSurface() {
		let reflowStage = () => {

			const scaleX = window.innerWidth / this.ctx.canvas.width;
			const scaleY = window.innerHeight / this.ctx.canvas.height;
			let scale = Math.min(scaleX, scaleY);
			this.scale = scale;

			this.ctx.canvas.parentNode.style.webkitTransform = "scale(" + scale + ")";
			this.ctx.canvas.parentNode.style.transform = "scale(" + scale + ")";
		}

		window.addEventListener('resize', reflowStage);

		window.addEventListener('orientationchage', reflowStage)

		reflowStage();
	}

	startInput() {
		let getXandY = (e) => {
			let x = e.clientX - this.ctx.canvas.getBoundingClientRect().left;
			let y = e.clientY - this.ctx.canvas.getBoundingClientRect().top;

			return {x: x, y: y};
		}

		let getTouchXandTouchY = (e) => {
			let x = e.targetTouches[0].pageX - this.ctx.canvas.clientLeft;
			let y = e.targetTouches[0].pageY - this.ctx.canvas.clientTop;

			return {x: x, y: y};
		}

		this.ctx.canvas.addEventListener('click', (e) => {
			this.click = getXandY(e);
		}, false);

		this.ctx.canvas.addEventListener('touchstart', (e) => {
			e.preventDefault();
			this.click = getTouchXandTouchY(e);
		});
	}

	loop() {
		this.clockTick = this.timer.tick();
		this.update();
		this.draw();
		this.click = null;
	}

	addEntity(entity) {
		console.log("Adding entity: ", entity);
		this.entities.push(entity);
	}

	draw(drawCallback) {
		this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
		this.ctx.save();
		this.ctx.translate(0, this.ctx.canvas.height);
		this.ctx.scale(1, -1);
		
		if(drawCallback) {
			drawCallback(this);
		}

		for(let i = 0; i < this.entities.length; i++) {
			this.entities[i].draw(this.ctx);
		}

		

		this.ctx.restore();
	}

	update() {
		let entitiesCount = this.entities.length;

		for(let i = 0; i < entitiesCount; i++) {
			let entity = this.entities[i];

			if(!entity.removeFromWorld) {
				entity.update();
			}
		}

		for(let i = this.entities.length-1; i >= 0; --i) {
			if(this.entities[i].removeFromWorld) {
				this.entities.splice(i, 1);
			}
		}
	}
}