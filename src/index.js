import Game from './game/BalisticDefence';

let canvas = document.getElementById('view');
let ctx = canvas.getContext('2d');

//Detect iPhone
if((navigator.userAgent.match(/iPhone/i))) {
	canvas.width = window.innerHeight;
}

let game = new Game();

game.init(ctx);

console.log(game);
