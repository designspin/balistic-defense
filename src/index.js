import Game from './game/BalisticDefence';

let canvas = document.getElementById('view');
let ctx = canvas.getContext('2d');

let game = new Game();

game.init(ctx);
