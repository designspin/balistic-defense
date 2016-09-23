import MissileLauncher from '../objects/MissileLauncher';

import City from '../entities/City';
import PlayerMissile from '../entities/PlayerMissile';
import EnemyMissile from '../entities/EnemyMissile';

export default class {
	constructor(game, wave) {
		this.game = game;
		
		this.wave = wave;
		this.maxMissilesInPlay = null;
		this.timeBetweenRelease = null;
		this.maxMissileRelease = null;
		this.missilesToRelease = null;
		this.launchSpeed = null;
		this.onTarget = {list: [true, false], weight: [0.9,0.1]};
		this.splitLaunch = {list: [true, false], weight: [0.4, 0.6]};
		

		this.setupLevel(this.wave);

		this.game.launchpads = [];
		this.timer = 0;
		//Setup launchpads
		this.game.launchpads[0] = new MissileLauncher(game, 20, 40);
		this.game.addEntity(this.game.launchpads[0]);
		this.game.launchpads[1] = new MissileLauncher(game, this.game.ctx.canvas.width / 2, 40);
		this.game.addEntity(this.game.launchpads[1]);
		this.game.launchpads[2] = new MissileLauncher(game, this.game.ctx.canvas.width - 20, 40);
		this.game.addEntity(this.game.launchpads[2]);
		//Setup cities
    	for(let i = 0; i < this.game.cities.info.length; i++) {
    		if(this.game.cities.info[i].isAlive) {
    			let city = this.game.cities.info[i];
    			city.instance = new City(this.game, city.x, city.y, i)
    			this.game.addEntity(city.instance);
    		}
    	}	
  	}

	setupLevel(wave) {
		this.maxMissilesInPlay  = [8  ,8  ,8  ,8  ,10  ,10  ,10  ,10  ,12 ,12 ,12 ,12 ,14  ,14  ,14  ,14  ,16  ,16  ,16  ,16][wave-1];
		this.timeBetweenRelease = [3  ,3  ,3  ,3  ,2.5 ,2.5 ,2.5 ,2.5 ,2  ,2  ,2  ,2  ,1.5 ,1.5 ,1.5 ,1.5 ,1   ,1   ,1   ,1 ][wave-1];
		this.maxMissileRelease  = [4  ,4  ,4  ,4  ,6   ,6   ,6   ,6   ,8  ,8  ,8  ,8  ,8   ,8   ,8   ,8   ,8   ,8   ,8   ,8 ][wave-1];
		this.missilesToRelease  = [18 ,18 ,18 ,18 ,22  ,22  ,22  ,22  ,24 ,24 ,24 ,24 ,26  ,26  ,26  ,26  ,28  ,28  ,30  ,30][wave-1];
		this.launchSpeed		= [20 ,25 ,30 ,35 ,40  ,45  ,50  ,55  ,60 ,65 ,70 ,75 ,80  ,85  ,90  ,95  ,100 ,105 ,110 ,120][wave-1];
	}

	rand(min, max) {
		return Math.random() * (max - min) + min;
	}

	getRandomItem(list, weight) {
		let total_weight = weight.reduce((prev, cur, i, arr) => {
        	return prev + cur;
    	});
     
    	let random_num = this.rand(0, total_weight);
    	let weight_sum = 0;
   
	    for (let i = 0; i < list.length; i++) {
	        weight_sum += weight[i];
	        weight_sum = +weight_sum.toFixed(2);
	         
	        if (random_num <= weight_sum) {
	            return list[i];
	        }
	    }
	}

	update() {
		this.timer += this.game.clockTick;
		let launchStart = null;
		let launchTarget = null;

		//Launch a player missile on click or touch
		if(this.game.click) {
			this.launchPlayerMissile();
		}

		//Launch some missiles
		if (this.timer > this.timeBetweenRelease && this.missilesToRelease > 0) {

			let targetlist = [];
			let missilelist = [];
			const splitLaunch = this.getRandomItem(this.splitLaunch.list, this.splitLaunch.weight);

			//Gather list of targets
			for(let i = 0; i < this.game.entities.length; i++) {
				if(this.game.entities[i] instanceof City || this.game.entities[i] instanceof MissileLauncher) {
					targetlist.push(this.game.entities[i]);
				}
				if(this.game.entities[i] instanceof EnemyMissile) {
					if(this.game.entities[i].x > this.game.ctx.canvas.height / 3) {
						missilelist.push(this.game.entities[i]);
					}
				}
			}

			this.timer = 0;
			
			
			if(missilelist.length && splitLaunch) {
				
				let filteredMissileList = missilelist.filter((object) => {
						return object.y > 160;
				});

				const selection = filteredMissileList[Math.floor(Math.random() * filteredMissileList.length-1) + 1];
				launchStart = (selection != undefined) ? {x: selection.x, y: selection.y} : false;
			} else {
				launchStart = false;
			}

			let launchQuantity = this.maxMissilesInPlay - this.game.missilesInPlay;
			launchQuantity = (launchQuantity > this.maxMissileRelease) ? this.maxMissileRelease : (launchQuantity < this.missilesToRelease ? launchQuantity : this.missilesToRelease);

			this.missilesToRelease -= launchQuantity;

			for(let i = 0; i < launchQuantity; i++) {
		
				if(!launchStart) {
					launchStart = {x: Math.floor(Math.random() * this.game.ctx.canvas.width) +1, y: this.game.ctx.canvas.height};
				}

				if(this.getRandomItem(this.onTarget.list, this.onTarget.weight)) {
					const selection = targetlist[Math.floor(Math.random() * targetlist.length-1) + 1];
					launchTarget = {x: selection.x, y: selection.y};
				} else {
					launchTarget = {x: Math.floor(Math.random() * this.game.ctx.canvas.width) +1, y: 10};
				}


				this.game.missilesInPlay += 1;
				var enemyMissile = new EnemyMissile(this.game, launchTarget.x, launchTarget.y, launchStart.x, launchStart.y, this.launchSpeed);
      			this.game.addEntity(enemyMissile);
      			
      			if (!splitLaunch) {
      				launchStart = false;
      			}
			}
		}

		//Run out of missiles
		if(this.game.launchpads[0].missiles < 1 && this.game.launchpads[1].missiles < 1 && this.game.launchpads[2].missiles < 1) {
			this.missilesToRelease = 0;
			this.game.speedMultiplier = true;
		}


		//No entities on screen apart from cities and wave over or missiles used
		if(this.game.speedMultiplier || this.missilesToRelease < 1) {
			let complete = false;

			if(this.game.entities.length) {
				for(let k = 0; k < this.game.entities.length; k++) {
					if(this.game.entities[k] instanceof City || this.game.entities[k] instanceof MissileLauncher) {
						complete = true;
					} else {
						complete = false;
					}
				}
			} else {
				complete = true;
			}
			if(complete) {
				this.game.speedMultiplier = false;
				this.game.levelover(this.game, this.landscapeImage, this.launchpads);
			}
		}
	}

	draw(ctx) {
	  this.game.score.draw();
	}

	launchPlayerMissile() {
		let launcherIndex = null,
				distance = null,
				missile = null,
				click = this.game.click,
				canvas = this.game.ctx.canvas;

		for (let i = 0; i < this.game.launchpads.length; i++) {
			let currentDistance = this.game.launchpads[i].getDistance(click.x, click.y, this.game.scale)

			if((currentDistance < distance || distance === null) && this.game.launchpads[i].missiles > 0) {
				distance = currentDistance;
				launcherIndex = i;
			}
		}

		if(distance != null) {
			this.game.launchpads[launcherIndex].missiles -= 1;
			this.game.audioplayer.play('launch');
			missile = new PlayerMissile(this.game, (click.x / this.game.scale), canvas.height - (click.y / this.game.scale), this.game.launchpads[launcherIndex].x, this.game.launchpads[launcherIndex].y);
			this.game.addEntity(missile);
		}
	}
}