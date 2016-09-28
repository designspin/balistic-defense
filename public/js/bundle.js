(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*

  Javascript State Machine Library - https://github.com/jakesgordon/javascript-state-machine

  Copyright (c) 2012, 2013, 2014, 2015, Jake Gordon and contributors
  Released under the MIT license - https://github.com/jakesgordon/javascript-state-machine/blob/master/LICENSE

*/

(function () {

  var StateMachine = {

    //---------------------------------------------------------------------------

    VERSION: "2.3.5",

    //---------------------------------------------------------------------------

    Result: {
      SUCCEEDED:    1, // the event transitioned successfully from one state to another
      NOTRANSITION: 2, // the event was successfull but no state transition was necessary
      CANCELLED:    3, // the event was cancelled by the caller in a beforeEvent callback
      PENDING:      4  // the event is asynchronous and the caller is in control of when the transition occurs
    },

    Error: {
      INVALID_TRANSITION: 100, // caller tried to fire an event that was innapropriate in the current state
      PENDING_TRANSITION: 200, // caller tried to fire an event while an async transition was still pending
      INVALID_CALLBACK:   300 // caller provided callback function threw an exception
    },

    WILDCARD: '*',
    ASYNC: 'async',

    //---------------------------------------------------------------------------

    create: function(cfg, target) {

      var initial      = (typeof cfg.initial == 'string') ? { state: cfg.initial } : cfg.initial; // allow for a simple string, or an object with { state: 'foo', event: 'setup', defer: true|false }
      var terminal     = cfg.terminal || cfg['final'];
      var fsm          = target || cfg.target  || {};
      var events       = cfg.events || [];
      var callbacks    = cfg.callbacks || {};
      var map          = {}; // track state transitions allowed for an event { event: { from: [ to ] } }
      var transitions  = {}; // track events allowed from a state            { state: [ event ] }

      var add = function(e) {
        var from = (e.from instanceof Array) ? e.from : (e.from ? [e.from] : [StateMachine.WILDCARD]); // allow 'wildcard' transition if 'from' is not specified
        map[e.name] = map[e.name] || {};
        for (var n = 0 ; n < from.length ; n++) {
          transitions[from[n]] = transitions[from[n]] || [];
          transitions[from[n]].push(e.name);

          map[e.name][from[n]] = e.to || from[n]; // allow no-op transition if 'to' is not specified
        }
      };

      if (initial) {
        initial.event = initial.event || 'startup';
        add({ name: initial.event, from: 'none', to: initial.state });
      }

      for(var n = 0 ; n < events.length ; n++)
        add(events[n]);

      for(var name in map) {
        if (map.hasOwnProperty(name))
          fsm[name] = StateMachine.buildEvent(name, map[name]);
      }

      for(var name in callbacks) {
        if (callbacks.hasOwnProperty(name))
          fsm[name] = callbacks[name]
      }

      fsm.current     = 'none';
      fsm.is          = function(state) { return (state instanceof Array) ? (state.indexOf(this.current) >= 0) : (this.current === state); };
      fsm.can         = function(event) { return !this.transition && (map[event].hasOwnProperty(this.current) || map[event].hasOwnProperty(StateMachine.WILDCARD)); }
      fsm.cannot      = function(event) { return !this.can(event); };
      fsm.transitions = function()      { return transitions[this.current]; };
      fsm.isFinished  = function()      { return this.is(terminal); };
      fsm.error       = cfg.error || function(name, from, to, args, error, msg, e) { throw e || msg; }; // default behavior when something unexpected happens is to throw an exception, but caller can override this behavior if desired (see github issue #3 and #17)

      if (initial && !initial.defer)
        fsm[initial.event]();

      return fsm;

    },

    //===========================================================================

    doCallback: function(fsm, func, name, from, to, args) {
      if (func) {
        try {
          return func.apply(fsm, [name, from, to].concat(args));
        }
        catch(e) {
          return fsm.error(name, from, to, args, StateMachine.Error.INVALID_CALLBACK, "an exception occurred in a caller-provided callback function", e);
        }
      }
    },

    beforeAnyEvent:  function(fsm, name, from, to, args) { return StateMachine.doCallback(fsm, fsm['onbeforeevent'],                       name, from, to, args); },
    afterAnyEvent:   function(fsm, name, from, to, args) { return StateMachine.doCallback(fsm, fsm['onafterevent'] || fsm['onevent'],      name, from, to, args); },
    leaveAnyState:   function(fsm, name, from, to, args) { return StateMachine.doCallback(fsm, fsm['onleavestate'],                        name, from, to, args); },
    enterAnyState:   function(fsm, name, from, to, args) { return StateMachine.doCallback(fsm, fsm['onenterstate'] || fsm['onstate'],      name, from, to, args); },
    changeState:     function(fsm, name, from, to, args) { return StateMachine.doCallback(fsm, fsm['onchangestate'],                       name, from, to, args); },

    beforeThisEvent: function(fsm, name, from, to, args) { return StateMachine.doCallback(fsm, fsm['onbefore' + name],                     name, from, to, args); },
    afterThisEvent:  function(fsm, name, from, to, args) { return StateMachine.doCallback(fsm, fsm['onafter'  + name] || fsm['on' + name], name, from, to, args); },
    leaveThisState:  function(fsm, name, from, to, args) { return StateMachine.doCallback(fsm, fsm['onleave'  + from],                     name, from, to, args); },
    enterThisState:  function(fsm, name, from, to, args) { return StateMachine.doCallback(fsm, fsm['onenter'  + to]   || fsm['on' + to],   name, from, to, args); },

    beforeEvent: function(fsm, name, from, to, args) {
      if ((false === StateMachine.beforeThisEvent(fsm, name, from, to, args)) ||
          (false === StateMachine.beforeAnyEvent( fsm, name, from, to, args)))
        return false;
    },

    afterEvent: function(fsm, name, from, to, args) {
      StateMachine.afterThisEvent(fsm, name, from, to, args);
      StateMachine.afterAnyEvent( fsm, name, from, to, args);
    },

    leaveState: function(fsm, name, from, to, args) {
      var specific = StateMachine.leaveThisState(fsm, name, from, to, args),
          general  = StateMachine.leaveAnyState( fsm, name, from, to, args);
      if ((false === specific) || (false === general))
        return false;
      else if ((StateMachine.ASYNC === specific) || (StateMachine.ASYNC === general))
        return StateMachine.ASYNC;
    },

    enterState: function(fsm, name, from, to, args) {
      StateMachine.enterThisState(fsm, name, from, to, args);
      StateMachine.enterAnyState( fsm, name, from, to, args);
    },

    //===========================================================================

    buildEvent: function(name, map) {
      return function() {

        var from  = this.current;
        var to    = map[from] || map[StateMachine.WILDCARD] || from;
        var args  = Array.prototype.slice.call(arguments); // turn arguments into pure array

        if (this.transition)
          return this.error(name, from, to, args, StateMachine.Error.PENDING_TRANSITION, "event " + name + " inappropriate because previous transition did not complete");

        if (this.cannot(name))
          return this.error(name, from, to, args, StateMachine.Error.INVALID_TRANSITION, "event " + name + " inappropriate in current state " + this.current);

        if (false === StateMachine.beforeEvent(this, name, from, to, args))
          return StateMachine.Result.CANCELLED;

        if (from === to) {
          StateMachine.afterEvent(this, name, from, to, args);
          return StateMachine.Result.NOTRANSITION;
        }

        // prepare a transition method for use EITHER lower down, or by caller if they want an async transition (indicated by an ASYNC return value from leaveState)
        var fsm = this;
        this.transition = function() {
          fsm.transition = null; // this method should only ever be called once
          fsm.current = to;
          StateMachine.enterState( fsm, name, from, to, args);
          StateMachine.changeState(fsm, name, from, to, args);
          StateMachine.afterEvent( fsm, name, from, to, args);
          return StateMachine.Result.SUCCEEDED;
        };
        this.transition.cancel = function() { // provide a way for caller to cancel async transition if desired (issue #22)
          fsm.transition = null;
          StateMachine.afterEvent(fsm, name, from, to, args);
        }

        var leave = StateMachine.leaveState(this, name, from, to, args);
        if (false === leave) {
          this.transition = null;
          return StateMachine.Result.CANCELLED;
        }
        else if (StateMachine.ASYNC === leave) {
          return StateMachine.Result.PENDING;
        }
        else {
          if (this.transition) // need to check in case user manually called transition() but forgot to return StateMachine.ASYNC
            return this.transition();
        }

      };
    }

  }; // StateMachine

  //===========================================================================

  //======
  // NODE
  //======
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = StateMachine;
    }
    exports.StateMachine = StateMachine;
  }
  //============
  // AMD/REQUIRE
  //============
  else if (typeof define === 'function' && define.amd) {
    define(function(require) { return StateMachine; });
  }
  //========
  // BROWSER
  //========
  else if (typeof window !== 'undefined') {
    window.StateMachine = StateMachine;
  }
  //===========
  // WEB WORKER
  //===========
  else if (typeof self !== 'undefined') {
    self.StateMachine = StateMachine;
  }

}());

},{}],2:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _GameEngine2 = require('../lib/GameEngine');

var _GameEngine3 = _interopRequireDefault(_GameEngine2);

var _AssetManager = require('../lib/AssetManager');

var _AssetManager2 = _interopRequireDefault(_AssetManager);

var _AudioPlayer = require('../lib/AudioPlayer');

var _AudioPlayer2 = _interopRequireDefault(_AudioPlayer);

var _javascriptStateMachine = require('javascript-state-machine');

var _javascriptStateMachine2 = _interopRequireDefault(_javascriptStateMachine);

var _PubSub = require('../lib/PubSub');

var _PubSub2 = _interopRequireDefault(_PubSub);

var _ScoreBoard = require('./objects/ScoreBoard');

var _ScoreBoard2 = _interopRequireDefault(_ScoreBoard);

var _LoadingScene = require('./scene/LoadingScene');

var _LoadingScene2 = _interopRequireDefault(_LoadingScene);

var _TitleScene = require('./scene/TitleScene');

var _TitleScene2 = _interopRequireDefault(_TitleScene);

var _PlayScene = require('./scene/PlayScene');

var _PlayScene2 = _interopRequireDefault(_PlayScene);

var _LevelUpScene = require('./scene/LevelUpScene');

var _LevelUpScene2 = _interopRequireDefault(_LevelUpScene);

var _LevelOverScene = require('./scene/LevelOverScene');

var _LevelOverScene2 = _interopRequireDefault(_LevelOverScene);

var _GameOverScene = require('./scene/GameOverScene');

var _GameOverScene2 = _interopRequireDefault(_GameOverScene);

var _ScoreEntryScene = require('./scene/ScoreEntryScene');

var _ScoreEntryScene2 = _interopRequireDefault(_ScoreEntryScene);

var _constants = require('./objects/constants');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var BalisticDefence = function (_GameEngine) {
	_inherits(BalisticDefence, _GameEngine);

	function BalisticDefence() {
		_classCallCheck(this, BalisticDefence);

		var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(BalisticDefence).call(this));

		_this.ctx = null;
		_this.scene = null;
		_this.showOutlines = false;

		_this.speedMultiplier = false;
		_this.landscapeImage = null;
		_this.background = null;
		_this.score = null;
		_this.launchpads = [];

		_this.soundUnlock = false;
		_this.ASSET_MANAGER = new _AssetManager2.default();
		_this.audioplayer = new _AudioPlayer2.default(_this.ASSET_MANAGER);

		_this.reset();

		_this.subscribe(_constants.Events.CITY_DESTROYED, function (city) {
			_this.onCityDestroyed(city);
		});

		_this.subscribe(_constants.Events.PLAYER_KILLED_ENEMY_MISSILE, function () {
			_this.onPlayerKilledEnemyMissile();
		});

		return _this;
	}

	_createClass(BalisticDefence, [{
		key: 'init',
		value: function init(ctx) {
			_get(Object.getPrototypeOf(BalisticDefence.prototype), 'init', this).call(this, ctx);
			this.score = new _ScoreBoard2.default(ctx, 'ballistic-highscore-table', [{ name: 'JLF', score: 50000 }, { name: 'JLF', score: 40000 }, { name: 'JLF', score: 30000 }, { name: 'JLF', score: 20000 }, { name: 'JLF', score: 10000 }, { name: 'JLF', score: 5000 }, { name: 'JLF', score: 1000 }, { name: 'JLF', score: 500 }]);

			this.setUpCities();
			this.landscapeImage = this.cachedLandscape();
			this.background = this.cacheBackgroundImage();
			this.startup(); // Fire FSM startup event;
		}
	}, {
		key: 'start',
		value: function start() {
			_get(Object.getPrototypeOf(BalisticDefence.prototype), 'start', this).call(this);
		}
	}, {
		key: 'reset',
		value: function reset() {
			this.entities = [];
			this.wave = 0;
			this.cities = { qty: 6, info: [] };
			this.missilesInPlay = 0;
		}
	}, {
		key: 'setUpCities',
		value: function setUpCities() {
			var step = (this.ctx.canvas.width - 160) / 6;
			var cityPosX = 50 + step / 2;

			for (var i = 0; i < this.cities.qty; i++) {
				this.cities.info.push({ x: cityPosX, y: 26, isAlive: true, instance: null });

				if (i + 1 == 3) {
					cityPosX = cityPosX + 60;
				}

				cityPosX = cityPosX + step;
			}
		}
		////////////////////////////
		// State machine handlers //
		////////////////////////////
		// Event Handles

	}, {
		key: 'onafterlevelreset',
		value: function onafterlevelreset() {
			this.reset();
			this.setUpCities();
			this.score.reset();
		}
		// State Handles

	}, {
		key: 'onenterloading',
		value: function onenterloading() {
			this.scene = new _LoadingScene2.default(this);
			this.start();
		}
	}, {
		key: 'onentertitle',
		value: function onentertitle() {
			this.scene = new _TitleScene2.default(this);
		}
	}, {
		key: 'onenterlevelinfo',
		value: function onenterlevelinfo() {
			this.wave += 1;
			this.scene = new _LevelUpScene2.default(this, this.wave);
		}
	}, {
		key: 'onenterplaying',
		value: function onenterplaying() {
			this.scene = new _PlayScene2.default(this, this.wave, this.cities);
		}
	}, {
		key: 'onenterlevelcomplete',
		value: function onenterlevelcomplete() {
			if (this.cities.qty < 1) {
				this.scene = new _GameOverScene2.default(this);
			} else {
				this.scene = new _LevelOverScene2.default(this);
			}
		}
	}, {
		key: 'onenternewhighscore',
		value: function onenternewhighscore() {
			this.scene = new _ScoreEntryScene2.default(this);
		}
		////////////////////////////
		//  PubSub handlers 			//
		////////////////////////////

	}, {
		key: 'onCityDestroyed',
		value: function onCityDestroyed(city) {
			this.cities.qty -= 1;
			this.cities.info[city.position].isAlive = false;

			if (this.cities.qty < 1) {
				this.speedMultiplier = true;
			}
		}
	}, {
		key: 'onPlayerKilledEnemyMissile',
		value: function onPlayerKilledEnemyMissile() {
			this.score.add(100);
		}
		////////////////////////////
		// Update                 //
		////////////////////////////

	}, {
		key: 'update',
		value: function update() {
			this.updateScene();
			_get(Object.getPrototypeOf(BalisticDefence.prototype), 'update', this).call(this);
		}

		//Update function for title screen

	}, {
		key: 'updateScene',
		value: function updateScene() {
			this.scene.update();
		}

		////////////////////////////
		// Draw                   //
		////////////////////////////

	}, {
		key: 'draw',
		value: function draw() {
			var _this2 = this;

			_get(Object.getPrototypeOf(BalisticDefence.prototype), 'draw', this).call(this, function (game) {
				// this.ctx.drawImage(this.background, 0, 0);
				game.drawScene(_this2.ctx);
			});
		}

		//Draw function for title screen

	}, {
		key: 'drawScene',
		value: function drawScene(ctx) {
			this.scene.draw(ctx);
		}
	}, {
		key: 'cacheBackgroundImage',
		value: function cacheBackgroundImage() {
			var offscreencanvas = document.createElement('canvas');
			offscreencanvas.width = this.ctx.canvas.width;
			offscreencanvas.height = this.ctx.canvas.height;
			var offctx = offscreencanvas.getContext('2d');

			// Create gradient
			var grd = offctx.createLinearGradient(0, this.ctx.canvas.height, 0, 0);
			// Add colors
			grd.addColorStop(0.000, 'rgba(0, 0, 255, 1.000)');
			grd.addColorStop(1.000, 'rgba(0, 255, 255, 1.000)');
			offctx.fillStyle = grd;
			offctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
			offctx.drawImage(this.landscapeImage, 0, 0);
			return offscreencanvas;
		}

		//Cahed landscape image

	}, {
		key: 'cachedLandscape',
		value: function cachedLandscape() {
			var platformWidth = 40;
			var platformIncline = 10;
			var platformHeight = 40;
			var groundLevel = 10;

			var offscreencanvas = document.createElement('canvas');
			var offscreenctx = offscreencanvas.getContext('2d');

			offscreencanvas.width = this.ctx.canvas.width;
			offscreencanvas.height = platformHeight;

			var landscapeDistance = (offscreenctx.canvas.width - platformWidth * 3 - platformIncline * 4) / 2;

			offscreenctx.save();
			// Create gradient
			var grd = offscreenctx.createLinearGradient(0, 0, offscreenctx.canvas.width, offscreenctx.canvas.height);

			// Add colors
			grd.addColorStop(0.000, 'rgba(0, 127, 63, 1.000)');
			grd.addColorStop(0.500, 'rgba(95, 191, 0, 1.000)');
			grd.addColorStop(1.000, 'rgba(0, 127, 63, 1.000)');
			offscreenctx.fillStyle = grd;
			offscreenctx.beginPath();
			offscreenctx.moveTo(0, platformHeight);
			offscreenctx.lineTo(platformWidth, platformHeight);
			offscreenctx.lineTo(platformWidth + platformIncline, groundLevel);
			offscreenctx.lineTo(platformWidth + platformIncline + landscapeDistance, groundLevel);
			offscreenctx.lineTo(platformWidth + platformIncline * 2 + landscapeDistance, platformHeight);
			offscreenctx.lineTo(platformWidth * 2 + platformIncline * 2 + landscapeDistance, platformHeight);
			offscreenctx.lineTo(platformWidth * 2 + platformIncline * 3 + landscapeDistance, groundLevel);
			offscreenctx.lineTo(platformWidth * 2 + platformIncline * 3 + landscapeDistance * 2, groundLevel);
			offscreenctx.lineTo(platformWidth * 2 + platformIncline * 4 + landscapeDistance * 2, platformHeight);
			offscreenctx.lineTo(platformWidth * 3 + platformIncline * 4 + landscapeDistance * 2, platformHeight);
			offscreenctx.lineTo(platformWidth * 3 + platformIncline * 4 + landscapeDistance * 2, 0);
			offscreenctx.lineTo(0, 0);
			offscreenctx.fill();
			offscreenctx.restore();

			return offscreencanvas;
		}
	}]);

	return BalisticDefence;
}(_GameEngine3.default);

_javascriptStateMachine2.default.create({
	target: BalisticDefence.prototype,
	events: [{ name: 'startup', from: 'none', to: 'loading' }, { name: 'gameloaded', from: 'loading', to: 'title' }, { name: 'levelup', from: ['title', 'levelcomplete'], to: 'levelinfo' }, { name: 'startgame', from: 'levelinfo', to: 'playing' }, { name: 'levelover', from: 'playing', to: 'levelcomplete' }, { name: 'levelreset', from: ['levelcomplete', 'newhighscore'], to: 'title' }, { name: 'highscore', from: 'levelcomplete', to: 'newhighscore' }]
});

_PubSub2.default.activate(BalisticDefence.prototype);

exports.default = BalisticDefence;

},{"../lib/AssetManager":22,"../lib/AudioPlayer":23,"../lib/GameEngine":24,"../lib/PubSub":27,"./objects/ScoreBoard":12,"./objects/constants":13,"./scene/GameOverScene":14,"./scene/LevelOverScene":15,"./scene/LevelUpScene":16,"./scene/LoadingScene":17,"./scene/PlayScene":18,"./scene/ScoreEntryScene":19,"./scene/TitleScene":20,"javascript-state-machine":1}],3:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _GameEntity = require('../../lib/GameEntity');

var _GameEntity2 = _interopRequireDefault(_GameEntity);

var _SmokeTrail = require('./SmokeTrail');

var _SmokeTrail2 = _interopRequireDefault(_SmokeTrail);

var _Explosion = require('./Explosion');

var _Explosion2 = _interopRequireDefault(_Explosion);

var _EnemyMissile = require('./EnemyMissile');

var _EnemyMissile2 = _interopRequireDefault(_EnemyMissile);

var _EnemySmartMissile = require('./EnemySmartMissile');

var _EnemySmartMissile2 = _interopRequireDefault(_EnemySmartMissile);

var _constants = require('../objects/constants');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _class = function (_Entity) {
	_inherits(_class, _Entity);

	function _class(game, x, y, position) {
		_classCallCheck(this, _class);

		var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(_class).call(this, game, x, y));

		_this.sprite = _this.game.ASSET_MANAGER.getAsset('images/City.png');
		//this.radius = 16;
		_this.hitBox = { x: x - 16, y: y - 16, width: 32, height: 32 };
		_this.position = position;
		return _this;
	}

	_createClass(_class, [{
		key: 'draw',
		value: function draw(ctx) {
			_get(Object.getPrototypeOf(_class.prototype), 'draw', this).call(this, ctx);
			ctx.save();
			ctx.translate(-this.sprite.width / 2, -this.sprite.height / 2);
			ctx.drawImage(this.sprite, this.x, this.y);
			ctx.restore();
		}
	}, {
		key: 'update',
		value: function update() {
			for (var i = 0; i < this.game.entities.length; i++) {
				var entity = this.game.entities[i];

				if ((entity instanceof _EnemyMissile2.default || entity instanceof _EnemySmartMissile2.default) && this.isHit(entity)) {
					if (!this.removeFromWorld) {
						this.game.publish(_constants.Events.CITY_DESTROYED, this);
						this.removeFromWorld = true;
						entity.hitTarget = true;
						entity.targetX = entity.x;
						entity.targetY = entity.y;
						entity.explode(entity.x, entity.y);
						var explosion = new _Explosion2.default(this.game, this.x, this.y);
						this.game.addEntity(explosion);
					}

					for (var _i = 0; _i < 40; _i++) {
						var smoke = new _SmokeTrail2.default(this.game, this.x, this.y, 0 + (_i + 1 * 10));
						this.game.addEntity(smoke);
					}
				}
			}
		}

		/*isHit(entity) {
  	let distance_squared = (((this.x - entity.x) * (this.x - entity.x)) + ((this.y - entity.y) * (this.y - entity.y)));
    let radii_squared = (this.radius + entity.radius) * (this.radius + entity.radius);
    return distance_squared < radii_squared;
  }*/

	}, {
		key: 'isHit',
		value: function isHit(entity) {
			var withinX = entity.x > this.hitBox.x && entity.x < this.hitBox.x + this.hitBox.width;
			var withinY = entity.y > this.hitBox.y && entity.y < this.hitBox.y + this.hitBox.height;

			return withinX && withinY;
		}
	}]);

	return _class;
}(_GameEntity2.default);

exports.default = _class;

},{"../../lib/GameEntity":25,"../objects/constants":13,"./EnemyMissile":4,"./EnemySmartMissile":5,"./Explosion":6,"./SmokeTrail":9}],4:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _GameEntity = require('../../lib/GameEntity');

var _GameEntity2 = _interopRequireDefault(_GameEntity);

var _Explosion = require('./Explosion');

var _Explosion2 = _interopRequireDefault(_Explosion);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _class = function (_Entity) {
	_inherits(_class, _Entity);

	function _class(game, x, y, startX, startY, speed) {
		_classCallCheck(this, _class);

		var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(_class).call(this, game, startX, startY));

		_this.hitTarget = false;
		_this.radius = 2;
		_this.speed = speed;
		_this.targetX = x;
		_this.targetY = y;
		_this.angle = Math.atan2(x - startX, y - startY);
		_this.startX = startX;
		_this.startY = startY;

		_this.distanceToTravel = _this.getDistance(startX, startY, x, y);
		return _this;
	}

	_createClass(_class, [{
		key: 'update',
		value: function update() {
			_get(Object.getPrototypeOf(_class.prototype), 'update', this).call(this);

			if (this.game.speedMultiplier) {
				this.speed = 150;
			}

			if (this.hitTarget === false) {
				this.x += this.speed * this.game.clockTick * Math.sin(this.angle);
				this.y += this.speed * this.game.clockTick * Math.cos(this.angle);
			}

			if (this.hitTarget === true) {
				this.startX += this.speed * 20 * this.game.clockTick * Math.sin(this.angle);
				this.startY += this.speed * 20 * this.game.clockTick * Math.cos(this.angle);
			}

			if (this.getDistance(this.startX, this.startY, this.x, this.y) >= this.distanceToTravel && this.hitTarget === false) {
				this.hitTarget = true;
				this.explode(this.targetX, this.targetY);
			}

			if (this.hitTarget === true && this.startY - this.targetY < 0) {
				this.removeFromWorld = true;
			}
		}
	}, {
		key: 'draw',
		value: function draw(ctx) {
			_get(Object.getPrototypeOf(_class.prototype), 'draw', this).call(this, ctx);
			ctx.beginPath();
			var gradient = ctx.createLinearGradient(this.startX, this.startY, this.x, this.y);
			gradient.addColorStop(0, "rgba(255,255,255,0.1)");
			gradient.addColorStop(0.8, "rgba(255,255,255,0.9)");
			gradient.addColorStop(1, "rgba(255,255,0,0.9)");
			ctx.strokeStyle = gradient;
			ctx.moveTo(this.startX, this.startY);
			ctx.lineTo(this.x, this.y);
			ctx.lineWidth = 2;
			ctx.stroke();
			ctx.beginPath();
			ctx.fillStyle = '#FFA500';
			ctx.rect(this.x - 1, this.y - 1, 2, 2);
			ctx.fill();
		}
	}, {
		key: 'explode',
		value: function explode(x, y, instance) {
			this.game.audioplayer.play('explosion');
			this.game.missilesInPlay -= 1;
			var explosion = new _Explosion2.default(this.game, x, y, instance ? instance : this);
			this.game.addEntity(explosion);
		}
	}, {
		key: 'getDistance',
		value: function getDistance(x1, y1, x2, y2) {
			var a = x1 - x2;
			var b = y1 - y2;
			var length = Math.sqrt(a * a + b * b);

			return length;
		}
	}]);

	return _class;
}(_GameEntity2.default);

exports.default = _class;

},{"../../lib/GameEntity":25,"./Explosion":6}],5:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _GameEntity = require('../../lib/GameEntity');

var _GameEntity2 = _interopRequireDefault(_GameEntity);

var _MissileTarget = require('./MissileTarget');

var _MissileTarget2 = _interopRequireDefault(_MissileTarget);

var _Explosion = require('./Explosion');

var _Explosion2 = _interopRequireDefault(_Explosion);

var _SmokeTrail = require('./SmokeTrail');

var _SmokeTrail2 = _interopRequireDefault(_SmokeTrail);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _class = function (_Entity) {
	_inherits(_class, _Entity);

	function _class(game, x, y, startX, startY, speed) {
		_classCallCheck(this, _class);

		var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(_class).call(this, game, startX, startY));

		_this.hitTarget = false;
		_this.radius = 4;
		_this.speed = speed;
		_this.targetX = x;
		_this.targetY = y;
		_this.angle = Math.atan2(x - startX, y - startY);
		_this.startX = startX;
		_this.startY = startY;

		_this.distanceToTravel = _this.getDistance(startX, startY, x, y);
		_this.normalised = { x: (startX - x) / _this.distanceToTravel, y: (startY - y) / _this.distanceToTravel };
		_this.lookAhead = { x: _this.x + _this.normalised.x * 100, y: _this.y + _this.normalised.y * 100 };
		_this.lookAhead2 = { x: _this.x + _this.normalised.x * 50, y: _this.y + _this.normalised.y * 50 };
		return _this;
	}

	_createClass(_class, [{
		key: 'update',
		value: function update() {
			_get(Object.getPrototypeOf(_class.prototype), 'update', this).call(this);

			if (this.game.speedMultiplier) {
				this.speed = 150;
			}

			var particle = new _SmokeTrail2.default(this.game, this.x - 10 * Math.sin(this.angle), this.y - 8 * Math.cos(this.angle), this.angle);
			particle.radius = 3;
			this.game.addEntity(particle);

			this.angle = Math.atan2(this.targetX - this.x, this.targetY - this.y);
			this.distanceToTravel = this.getDistance(this.x, this.y, this.targetX, this.targetY);
			console.log(this.distanceToTravel);
			this.normalised = { x: (this.x - this.targetX) / this.distanceToTravel, y: (this.y - this.targetY) / this.distanceToTravel };
			this.lookAhead = { x: this.x - this.normalised.x * (this.speed / 2), y: this.y - this.normalised.y * (this.speed / 2) };
			this.lookAhead2 = { x: this.x - this.normalised.x * (this.speed / 2) / 2, y: this.y - this.normalised.y * (this.speed / 2) / 2 };

			var avoidance = this.collisionAvoidance();

			if (this.hitTarget === false) {
				this.x += this.speed * this.game.clockTick * (Math.sin(this.angle) + avoidance.x);
				this.y += this.speed * this.game.clockTick * (Math.cos(this.angle) + avoidance.y);
			}
			if (this.distanceToTravel < 1 && this.hitTarget === false) {
				this.hitTarget = true;
				this.removeFromWorld = true;
				this.explode(this.targetX, this.targetY);
			}
			if (this.hitTarget == true) {
				this.removeFromWorld = true;
			}
		}
	}, {
		key: 'drawTriangle',
		value: function drawTriangle(ctx) {
			var height = 8;
			var width = 4;

			var centerX = this.x;
			var centerY = this.y;

			var x1 = centerX;
			var y1 = centerY - height / 2;
			var x2 = centerX + width / 2;
			var y2 = centerY + height / 2;
			var x3 = centerX - width / 2;
			var y3 = y2;

			var x1r = (x1 - centerX) * -Math.cos(this.angle) - (y1 - centerY) * Math.sin(this.angle) + centerX;
			var y1r = (x1 - centerX) * Math.sin(this.angle) + (y1 - centerY) * -Math.cos(this.angle) + centerY;

			var x2r = (x2 - centerX) * -Math.cos(this.angle) - (y2 - centerY) * Math.sin(this.angle) + centerX;
			var y2r = (x2 - centerX) * Math.sin(this.angle) + (y2 - centerY) * -Math.cos(this.angle) + centerY;

			var x3r = (x3 - centerX) * -Math.cos(this.angle) - (y3 - centerY) * Math.sin(this.angle) + centerX;
			var y3r = (x3 - centerX) * Math.sin(this.angle) + (y3 - centerY) * -Math.cos(this.angle) + centerY;

			ctx.moveTo(x1r, y1r);
			ctx.lineTo(x2r, y2r);
			ctx.lineTo(x3r, y3r);
			ctx.lineTo(x1r, y1r);
		}
	}, {
		key: 'draw',
		value: function draw(ctx) {
			_get(Object.getPrototypeOf(_class.prototype), 'draw', this).call(this, ctx);
			ctx.save();
			ctx.beginPath();
			ctx.fillStyle = '#000000';
			this.drawTriangle(ctx);
			ctx.fill();
			ctx.restore();
		}
	}, {
		key: 'explode',
		value: function explode(x, y, instance) {
			this.game.audioplayer.play('explosion');
			this.game.missilesInPlay -= 1;
			var explosion = new _Explosion2.default(this.game, x, y, instance ? instance : this);
			this.game.addEntity(explosion);
		}
	}, {
		key: 'lineIntersectsCircle',
		value: function lineIntersectsCircle(ahead, ahead2, obstacle) {
			return this.getDistance(obstacle.x, obstacle.y, ahead.x, ahead.y) < obstacle.radius || this.getDistance(obstacle.x, obstacle.y, ahead2.x, ahead2.y) < obstacle.radius;
		}
	}, {
		key: 'collisionAvoidance',
		value: function collisionAvoidance() {
			var mostThreatening = this.findThreat();
			var avoidance = { x: 0, y: 0 };

			if (mostThreatening != null) {
				avoidance.x = this.lookAhead.x - mostThreatening.x;
				avoidance.y = this.lookAhead.y - mostThreatening.y;

				// Create a vector library for the next game!
				var length = Math.sqrt(avoidance.x * avoidance.x + avoidance.y * avoidance.y);
				avoidance.x /= length;
				avoidance.y /= length;
				avoidance.x / 0.005;
				avoidance.y / 0.005;
			} else {
				avoidance.x = 0;
				avoidance.y = 0;
			}

			return avoidance;
		}
	}, {
		key: 'findThreat',
		value: function findThreat() {
			var mostThreatening = null;

			for (var i = 0; i < this.game.entities.length; i++) {
				var obstacle = this.game.entities[i];
				var collision = null;

				if (obstacle instanceof _MissileTarget2.default || obstacle instanceof _Explosion2.default) {
					collision = this.lineIntersectsCircle(this.lookAhead, this.lookAhead2, obstacle);
				} else {
					continue;
				}

				if (collision && (mostThreatening == null || this.getDistance(this.x, this.y, obstacle.x, obstacle.y) < this.getDistance(this.x, this.y, mostThreatening.x, mostThreatening.y))) {
					mostThreatening = obstacle;
				}
			}

			return mostThreatening;
		}
	}, {
		key: 'explode',
		value: function explode(x, y, instance) {
			this.game.audioplayer.play('explosion');
			this.game.missilesInPlay -= 1;
			var explosion = new _Explosion2.default(this.game, x, y, instance ? instance : this);
			this.game.addEntity(explosion);
		}
	}, {
		key: 'getDistance',
		value: function getDistance(x1, y1, x2, y2) {
			var a = x1 - x2;
			var b = y1 - y2;
			var length = Math.sqrt(a * a + b * b);

			return length;
		}
	}]);

	return _class;
}(_GameEntity2.default);

exports.default = _class;

},{"../../lib/GameEntity":25,"./Explosion":6,"./MissileTarget":7,"./SmokeTrail":9}],6:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _GameEntity = require('../../lib/GameEntity');

var _GameEntity2 = _interopRequireDefault(_GameEntity);

var _EnemyMissile = require('./EnemyMissile');

var _EnemyMissile2 = _interopRequireDefault(_EnemyMissile);

var _EnemySmartMissile = require('./EnemySmartMissile');

var _EnemySmartMissile2 = _interopRequireDefault(_EnemySmartMissile);

var _PlayerMissile = require('./PlayerMissile');

var _PlayerMissile2 = _interopRequireDefault(_PlayerMissile);

var _constants = require('../objects/constants');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _class = function (_Entity) {
	_inherits(_class, _Entity);

	function _class(game, x, y, createdBy) {
		_classCallCheck(this, _class);

		var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(_class).call(this, game, x, y));

		_this.createdBy = createdBy;
		_this.imploding = false;
		_this.maxRadius = 20;
		_this.speed = 20;
		_this.radius = 1;
		return _this;
	}

	_createClass(_class, [{
		key: 'update',
		value: function update() {
			_get(Object.getPrototypeOf(_class.prototype), 'update', this).call(this);

			if (this.game.speedMultiplier) {
				this.speed = 150;
			}

			if (this.radius >= this.maxRadius) {
				this.imploding = true;
			}

			if (!this.imploding) {
				this.radius += this.speed * this.game.clockTick;
			} else {
				this.radius -= this.speed * this.game.clockTick;
			}

			for (var i = 0; i < this.game.entities.length; i++) {
				var entity = this.game.entities[i];

				if ((entity instanceof _EnemyMissile2.default || entity instanceof _EnemySmartMissile2.default) && entity.hitTarget === false && this.isCaughtInExplosion(entity)) {

					if (this.createdBy instanceof _PlayerMissile2.default) {
						this.game.publish(_constants.Events.PLAYER_KILLED_ENEMY_MISSILE);
						entity.explode(entity.x, entity.y, this.createdBy);
					} else {
						entity.explode(entity.x, entity.y);
					}

					entity.targetX = entity.x;
					entity.targetY = entity.y;
					entity.hitTarget = true;
				}
			}

			if (this.radius < 1) {
				this.removeFromWorld = true;

				if (this.createdBy instanceof _PlayerMissile2.default) {
					this.createdBy.targetGraphic.removeFromWorld = true;
				}
			}
		}
	}, {
		key: 'draw',
		value: function draw(ctx) {
			// Create gradient
			var grd = ctx.createRadialGradient(this.x, this.y, this.radius / 4, this.x, this.y, this.radius);

			// Add colors
			grd.addColorStop(0.379, 'rgba(255, 255, 255, 1.000)');
			grd.addColorStop(0.551, 'rgba(255, 255, 0, 1.000)');
			grd.addColorStop(0.877, 'rgba(255, 127, 0, 1.000)');
			grd.addColorStop(0.937, 'rgba(255, 0, 0, 0.714)');

			ctx.fillStyle = grd;
			ctx.beginPath();
			ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
			ctx.fill();
		}
	}, {
		key: 'isCaughtInExplosion',
		value: function isCaughtInExplosion(entity) {
			var distance_squared = (this.x - entity.x) * (this.x - entity.x) + (this.y - entity.y) * (this.y - entity.y);
			var radii_squared = (this.radius + entity.radius) * (this.radius + entity.radius);
			return distance_squared < radii_squared;
		}
	}]);

	return _class;
}(_GameEntity2.default);

exports.default = _class;

},{"../../lib/GameEntity":25,"../objects/constants":13,"./EnemyMissile":4,"./EnemySmartMissile":5,"./PlayerMissile":8}],7:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _GameEntity = require('../../lib/GameEntity');

var _GameEntity2 = _interopRequireDefault(_GameEntity);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _class = function (_Entity) {
	_inherits(_class, _Entity);

	function _class(game, x, y) {
		_classCallCheck(this, _class);

		var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(_class).call(this, game, x, y));

		_this.radius = 30;
		return _this;
	}

	_createClass(_class, [{
		key: 'draw',
		value: function draw(ctx) {
			_get(Object.getPrototypeOf(_class.prototype), 'draw', this).call(this, ctx);
			ctx.strokeStyle = '#FFFFFF';
			ctx.beginPath();
			ctx.moveTo(this.x - 4, this.y - 2);
			ctx.lineTo(this.x + 4, this.y + 2);
			ctx.moveTo(this.x + 4, this.y - 2);
			ctx.lineTo(this.x - 4, this.y + 2);
			ctx.stroke();
		}
	}]);

	return _class;
}(_GameEntity2.default);

exports.default = _class;

},{"../../lib/GameEntity":25}],8:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _GameEntity = require('../../lib/GameEntity');

var _GameEntity2 = _interopRequireDefault(_GameEntity);

var _MissileTarget = require('./MissileTarget');

var _MissileTarget2 = _interopRequireDefault(_MissileTarget);

var _SmokeTrail = require('./SmokeTrail');

var _SmokeTrail2 = _interopRequireDefault(_SmokeTrail);

var _Explosion = require('./Explosion');

var _Explosion2 = _interopRequireDefault(_Explosion);

var _Easing = require('../objects/Easing');

var _Easing2 = _interopRequireDefault(_Easing);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _class = function (_Entity) {
	_inherits(_class, _Entity);

	function _class(game, x, y, startX, startY) {
		_classCallCheck(this, _class);

		var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(_class).call(this, game, startX, startY));

		_this.speed = 200;
		_this.targetX = x;
		_this.targetY = y;
		_this.time = 0;
		_this.targetGraphic = new _MissileTarget2.default(game, x, y);
		game.addEntity(_this.targetGraphic);
		_this.angle = Math.atan2(x - startX, y - startY);
		_this.startX = startX;
		_this.startY = startY;
		_this.distanceToTravel = _this.getDistance(x, y, startX, startY);
		return _this;
	}

	_createClass(_class, [{
		key: 'update',
		value: function update() {
			_get(Object.getPrototypeOf(_class.prototype), 'update', this).call(this);

			var particle = new _SmokeTrail2.default(this.game, this.x, this.y, this.angle);
			this.game.addEntity(particle);

			this.x += _Easing2.default.easeInCirc(this.time, 0, this.speed, 3) * Math.sin(this.angle);
			this.y += _Easing2.default.easeInCirc(this.time, 0, this.speed, 3) * Math.cos(this.angle);

			if (this.getDistance(this.x, this.y, this.startX, this.startY) >= this.distanceToTravel) {
				this.removeFromWorld = true;
				//this.targetGraphic.removeFromWorld = true;
				var explosion = new _Explosion2.default(this.game, this.targetX, this.targetY, this);
				this.game.addEntity(explosion);
			}

			this.time += this.game.clockTick;
		}
	}, {
		key: 'draw',
		value: function draw(ctx) {
			_get(Object.getPrototypeOf(_class.prototype), 'draw', this).call(this, ctx);
			ctx.fillStyle = "#FFFFFF";
			ctx.beginPath();
			ctx.fillRect(this.x - 1, this.y - 1, 3, 3);
			ctx.stroke();
		}
	}, {
		key: 'getDistance',
		value: function getDistance(x1, y1, x2, y2) {
			var a = x1 - x2;
			var b = y1 - y2;
			var length = Math.sqrt(a * a + b * b);

			return length;
		}
	}]);

	return _class;
}(_GameEntity2.default);

exports.default = _class;

},{"../../lib/GameEntity":25,"../objects/Easing":10,"./Explosion":6,"./MissileTarget":7,"./SmokeTrail":9}],9:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _GameEntity = require("../../lib/GameEntity");

var _GameEntity2 = _interopRequireDefault(_GameEntity);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _class = function (_Entity) {
	_inherits(_class, _Entity);

	function _class(game, x, y, angle) {
		_classCallCheck(this, _class);

		var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(_class).call(this, game, x, y));

		_this.updateCount = 0;
		_this.radius = 5;
		_this.speed = 2;
		_this.opacity = 0.3;
		_this.angle = angle;
		return _this;
	}

	_createClass(_class, [{
		key: "update",
		value: function update() {
			_get(Object.getPrototypeOf(_class.prototype), "update", this).call(this);

			if (this.game.speedMultiplier) {
				this.speed = 10;
			}

			var yMod = Math.floor(Math.random() * 60) + 1;
			yMod *= Math.floor(Math.random() * 2) == 1 ? 1 : -1;

			this.x += 10 * Math.random() * this.game.clockTick * Math.sin(this.angle);
			this.y += yMod * Math.random() * this.game.clockTick * Math.cos(this.angle);

			this.radius = this.radius - this.speed * this.game.clockTick;

			if (this.radius < 1) {
				this.removeFromWorld = true;
			}

			this.updateCount += 1;
		}
	}, {
		key: "draw",
		value: function draw(ctx) {
			_get(Object.getPrototypeOf(_class.prototype), "draw", this).call(this, ctx);

			if (this.updateCount < 3) {
				ctx.fillStyle = "rgba(255, 255, 0," + 0.3 + ")";
			} else if (this.updateCount < 6) {
				ctx.fillStyle = "rgba(255, 167, 0," + 0.3 + ")";
			} else {
				ctx.fillStyle = "rgba(255, 255, 255," + this.opacity + ")";
			}

			ctx.beginPath();
			ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
			ctx.fill();
		}
	}]);

	return _class;
}(_GameEntity2.default);

exports.default = _class;

},{"../../lib/GameEntity":25}],10:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.default = {
	easeInCubic: function easeInCubic(time, start, end, duration) {
		return end * (time /= duration) * time * time + start;
	},
	easeInCirc: function easeInCirc(t, b, c, d) {
		t /= d;
		return -c * (Math.sqrt(1 - t * t) - 1) + b;
	},
	easeOutQuad: function easeOutQuad(t, b, c, d) {
		return -c * (t /= d) * (t - 2) + b;
	},
	easeInQuad: function easeInQuad(t, b, c, d) {
		t /= d;
		return c * t * t + b;
	},
	easeInOutQuad: function easeInOutQuad(t, b, c, d) {
		t /= d / 2;
		if (t < 1) return c / 2 * t * t + b;
		t--;
		return -c / 2 * (t * (t - 2) - 1) + b;
	},
	easeInSine: function easeInSine(t, b, c, d) {
		return -c * Math.cos(t / d * (Math.PI / 2)) + c + b;
	},
	easeInOutSine: function easeInOutSine(t, b, c, d) {
		return -c / 2 * (Math.cos(Math.PI * t / d) - 1) + b;
	}
};

},{}],11:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _GameEntity = require('../../lib/GameEntity');

var _GameEntity2 = _interopRequireDefault(_GameEntity);

var _EnemyMissile = require('../entities/EnemyMissile');

var _EnemyMissile2 = _interopRequireDefault(_EnemyMissile);

var _Explosion = require('../entities/Explosion');

var _Explosion2 = _interopRequireDefault(_Explosion);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _class = function (_Entity) {
  _inherits(_class, _Entity);

  function _class(game, x, y) {
    _classCallCheck(this, _class);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(_class).call(this, game, x, y));

    _this.hitTriangle = { p1: { x: x, y: y + 5 }, p2: { x: x - 12, y: y - 38 }, p3: { x: x + 12, y: y - 38 } };
    _this.missiles = 10;
    _this.sprite = game.ASSET_MANAGER.getAsset('images/missile-indicator.png');
    return _this;
  }

  _createClass(_class, [{
    key: 'getDistance',
    value: function getDistance(targetX, targetY, scale) {
      var a = targetX / scale - this.x;
      var b = targetY / scale - this.y;
      var length = Math.sqrt(a * a + b * b);

      return length;
    }
  }, {
    key: 'update',
    value: function update() {
      _get(Object.getPrototypeOf(_class.prototype), 'update', this).call(this);
      for (var i = 0; i < this.game.entities.length; i++) {
        var entity = this.game.entities[i];

        if (entity instanceof _EnemyMissile2.default && this.isHit(entity)) {
          if (entity.hitTarget === false) {
            entity.hitTarget = true;
            entity.explode(entity.x, entity.y);
            var explosion = new _Explosion2.default(this.game, this.x, this.y - 19);
            this.game.addEntity(explosion);
            this.missiles = 0;
          }
        }
      }
    }
  }, {
    key: 'isHit',
    value: function isHit(entity) {
      var p1 = this.hitTriangle.p1;
      var p2 = this.hitTriangle.p2;
      var p3 = this.hitTriangle.p3;
      var p = entity;

      var alpha = ((p2.y - p3.y) * (p.x - p3.x) + (p3.x - p2.x) * (p.y - p3.y)) / ((p2.y - p3.y) * (p1.x - p3.x) + (p3.x - p2.x) * (p1.y - p3.y));
      var beta = ((p3.y - p1.y) * (p.x - p3.x) + (p1.x - p3.x) * (p.y - p3.y)) / ((p2.y - p3.y) * (p1.x - p3.x) + (p3.x - p2.x) * (p1.y - p3.y));
      var gamma = 1 - alpha - beta;

      return alpha > 0 && beta > 0 && gamma > 0;
    }
  }, {
    key: 'draw',
    value: function draw(ctx) {
      _get(Object.getPrototypeOf(_class.prototype), 'draw', this).call(this, ctx);
      this.drawMissileIndicators(ctx);
    }
  }, {
    key: 'drawMissileIndicators',
    value: function drawMissileIndicators(ctx) {
      if (this.missiles < 4 && this.missiles > 0) {
        ctx.restore();
        ctx.fillStyle = "#0000FF";
        ctx.font = "10px Arial";
        ctx.textAlign = 'center';
        ctx.fillText("LOW", this.x, -this.y + ctx.canvas.height + 30);
        ctx.save();
        ctx.translate(0, ctx.canvas.height);
        ctx.scale(1, -1);
      }

      if (this.missiles < 1) {
        ctx.restore();
        ctx.fillStyle = "#0000FF";
        ctx.font = "10px Arial";
        ctx.textAlign = 'center';
        ctx.fillText("OUT", this.x, -this.y + ctx.canvas.height + 30);
        ctx.save();
        ctx.translate(0, ctx.canvas.height);
        ctx.scale(1, -1);
      }

      for (var m = 0; m < this.missiles; m++) {

        ctx.save();
        ctx.translate(-3, -5);
        if (m === 0) {
          ctx.drawImage(this.sprite, this.x, this.y, this.sprite.width, this.sprite.height);
        }
        if (m === 1) {
          ctx.drawImage(this.sprite, this.x - 3, this.y - 11, this.sprite.width, this.sprite.height);
        }
        if (m === 2) {
          ctx.drawImage(this.sprite, this.x + 3, this.y - 11, this.sprite.width, this.sprite.height);
        }
        if (m === 3) {
          ctx.drawImage(this.sprite, this.x - 6, this.y - 22, this.sprite.width, this.sprite.height);
        }
        if (m === 4) {
          ctx.drawImage(this.sprite, this.x, this.y - 22, this.sprite.width, this.sprite.height);
        }
        if (m === 5) {
          ctx.drawImage(this.sprite, this.x + 6, this.y - 22, this.sprite.width, this.sprite.height);
        }
        if (m === 6) {
          ctx.drawImage(this.sprite, this.x - 9, this.y - 33, this.sprite.width, this.sprite.height);
        }
        if (m === 7) {
          ctx.drawImage(this.sprite, this.x - 3, this.y - 33, this.sprite.width, this.sprite.height);
        }
        if (m === 8) {
          ctx.drawImage(this.sprite, this.x + 3, this.y - 33, this.sprite.width, this.sprite.height);
        }
        if (m === 9) {
          ctx.drawImage(this.sprite, this.x + 9, this.y - 33, this.sprite.width, this.sprite.height);
        }
        ctx.restore();
      }
    }
  }]);

  return _class;
}(_GameEntity2.default);

exports.default = _class;

},{"../../lib/GameEntity":25,"../entities/EnemyMissile":4,"../entities/Explosion":6}],12:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _class = function () {
	function _class(ctx, key, defaultScores) {
		_classCallCheck(this, _class);

		this.currentScore = 0;
		this.highScores = defaultScores || [];
		this.ctx = ctx;
		this.key = key;
		this.init();
	}

	_createClass(_class, [{
		key: 'init',
		value: function init() {
			if (localStorage && localStorage.getItem(this.key)) {
				this.highScores = JSON.parse(localStorage.getItem(this.key));
			}
		}
	}, {
		key: 'add',
		value: function add(n) {
			this.currentScore += n;
		}
	}, {
		key: 'isHighScore',
		value: function isHighScore() {
			for (var i = 0; i < this.highScores.length; i++) {
				if (this.currentScore > this.highScores[i].score) {
					return true;
				}
			}
			return false;
		}
	}, {
		key: 'addHighScore',
		value: function addHighScore(name) {
			var position = null;

			for (var i = 0; i < this.highScores.length; i++) {

				var row = this.highScores[i];

				if (this.currentScore > row.score) {
					position = i;
					break;
				}
			}
			console.log('position: ' + position);
			if (position != null) {
				this.highScores.splice(position, 0, { name: name, score: this.currentScore });
				this.highScores.pop();

				if (localStorage) {
					localStorage.setItem(this.key, JSON.stringify(this.highScores));
				}
			}
		}
	}, {
		key: 'minus',
		value: function minus(n) {
			this.currentScore -= n;
		}
	}, {
		key: 'reset',
		value: function reset() {
			this.currentScore = 0;
		}
	}, {
		key: 'draw',
		value: function draw() {
			var ctx = this.ctx;
			ctx.save();
			ctx.translate(0, ctx.canvas.height);
			ctx.scale(1, -1);
			ctx.font = '12px Arial';
			ctx.fillStyle = '#fff';
			ctx.textBaseline = 'top';
			ctx.textAlign = 'end';
			ctx.fillText('Score: ' + this.currentScore, ctx.canvas.width - 10, 10);
			ctx.restore();
		}
	}, {
		key: 'drawHighScores',
		value: function drawHighScores() {

			var ctx = this.ctx;
			ctx.save();
			ctx.translate(0, ctx.canvas.height);
			ctx.scale(1, -1);

			ctx.fillStyle = '#ffffff';
			ctx.lineWidth = 1;
			ctx.textAlign = 'center';
			ctx.font = '20px Arial';
			ctx.fillText('TOP DEFENDERS', ctx.canvas.width / 2, 60);

			ctx.font = '12px Arial';
			ctx.fillStyle = '#fff';
			for (var i = 0; i < this.highScores.length; i++) {
				var entry = this.highScores[i];
				ctx.textAlign = 'start';
				ctx.fillText('' + entry.name, ctx.canvas.width / 2 - 70, (ctx.canvas.height - 200) / this.highScores.length * i + 100);
				ctx.textAlign = 'end';
				ctx.fillText('' + entry.score, ctx.canvas.width / 2 + 70, (ctx.canvas.height - 200) / this.highScores.length * i + 100);
			}
			ctx.restore();
		}
	}]);

	return _class;
}();

exports.default = _class;

},{}],13:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});
var Events = exports.Events = {
	CITY_DESTROYED: 0,
	PLAYER_KILLED_ENEMY_MISSILE: 1
};

},{}],14:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _class = function () {
	function _class(game) {
		_classCallCheck(this, _class);

		this.game = game;
		this.timer = 0;
	}

	_createClass(_class, [{
		key: 'update',
		value: function update() {
			this.timer += this.game.clockTick;

			if (this.timer > 3) {

				if (this.game.score.isHighScore()) {
					this.game.highscore();
				} else {
					this.game.levelreset();
				}
			}
		}
	}, {
		key: 'draw',
		value: function draw(ctx) {
			ctx.restore();
			ctx.strokeStyle = '#ffffff';
			ctx.fillStyle = '#000000';
			ctx.lineWidth = 1;
			ctx.textBaseline = 'middle';
			ctx.textAlign = 'center';
			ctx.font = '40px Arial';
			ctx.fillText('GAME OVER', ctx.canvas.width / 2, ctx.canvas.height / 2 - 20);
			ctx.strokeText('GAME OVER', ctx.canvas.width / 2, ctx.canvas.height / 2 - 20);
		}
	}]);

	return _class;
}();

exports.default = _class;

},{}],15:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _City = require('../entities/City');

var _City2 = _interopRequireDefault(_City);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _class = function () {
	function _class(game) {
		_classCallCheck(this, _class);

		this.game = game;

		this.timer = 0;
		this.updateInterval = 0.5;

		this.bonusHandler = ['cities', 'missiles', 'finished'];
		this.currentHandler = 0;

		this.cityBonusScore = 0;
		this.missileBonusScore = 0;

		this.citiesSurvived = [];
		this.cityIndicators = [];

		this.setupCitiesSurvived();
	}

	_createClass(_class, [{
		key: 'setupCitiesSurvived',
		value: function setupCitiesSurvived() {
			var cities = this.game.cities.info;
			var xPos = -85;

			for (var city = 0; city < cities.length; city++) {
				if (cities[city].isAlive) {
					this.citiesSurvived.push({ x: this.game.ctx.canvas.width / 2 + xPos, y: this.game.ctx.canvas.height / 2, original: cities[city].instance });
					xPos += 47;
				}
			}
		}
	}, {
		key: 'update',
		value: function update() {
			this.timer += this.game.clockTick;

			if (this.timer >= this.updateInterval) {
				this.timer = 0;

				switch (this.bonusHandler[this.currentHandler]) {
					case 'cities':
						if (this.citiesSurvived.length) {
							this.citiesSurvived[0].original.removeFromWorld = true;
							this.game.audioplayer.play('city-ping');
							this.cityIndicators.push(new _City2.default(this.game, this.citiesSurvived[0].x, this.citiesSurvived[0].y));
							this.game.addEntity(this.cityIndicators[this.cityIndicators.length - 1]);
							this.citiesSurvived.shift();
							this.cityBonusScore += 100;
							this.game.score.add(100);
						} else {
							this.currentHandler += 1;
							this.updateInterval = 0.05;
						}
						break;
					case 'missiles':
						if (this.game.launchpads[0].missiles > 0) {
							this.game.launchpads[0].missiles -= 1;
							this.game.audioplayer.play('bullet-ping');
							this.missileBonusScore += 10;
							this.game.score.add(10);
						} else if (this.game.launchpads[1].missiles > 0) {
							this.game.launchpads[1].missiles -= 1;
							this.game.audioplayer.play('bullet-ping');
							this.missileBonusScore += 10;
							this.game.score.add(10);
						} else if (this.game.launchpads[2].missiles > 0) {
							this.game.launchpads[2].missiles -= 1;
							this.game.audioplayer.play('bullet-ping');
							this.missileBonusScore += 10;
							this.game.score.add(10);
						} else {
							this.updateInterval = 3;
							this.currentHandler += 1;
						}

						break;
					case 'finished':
						for (var i = 0; i < this.cityIndicators.length; i++) {
							this.cityIndicators[i].removeFromWorld = true;
						}
						this.game.launchpads[0].removeFromWorld = true;
						this.game.launchpads[1].removeFromWorld = true;
						this.game.launchpads[2].removeFromWorld = true;
						this.game.levelup();
						break;
				}
			}
		}
	}, {
		key: 'draw',
		value: function draw(ctx) {
			ctx.drawImage(this.game.background, 0, 0);
			this.drawMissileIndicators(ctx);
			this.game.score.draw();
			ctx.restore();
			ctx.strokeStyle = '#ffffff';
			ctx.fillStyle = '#000000';
			ctx.lineWidth = 1;
			ctx.textBaseline = 'middle';
			ctx.textAlign = 'center';
			ctx.font = '40px Arial';
			ctx.fillText('Wave ' + this.game.wave + ' Complete', ctx.canvas.width / 2, ctx.canvas.height / 2 - 100);
			ctx.strokeText('Wave ' + this.game.wave + ' Complete', ctx.canvas.width / 2, ctx.canvas.height / 2 - 100);
			ctx.font = '20px Arial';
			ctx.fillStyle = '#ffffff';
			ctx.fillText('Bonus', ctx.canvas.width / 2, ctx.canvas.height / 2 - 50);
			ctx.fillStyle = '#ffff00';
			ctx.textAlign = 'left';
			ctx.fillText('' + this.cityBonusScore, ctx.canvas.width / 2 - 165, ctx.canvas.height / 2 + 3);
			ctx.fillText('' + this.missileBonusScore, ctx.canvas.width / 2 - 165, ctx.canvas.height / 2 + 40);

			if (this.missileBonusScore > 0) {
				var xPos = -97;
				for (var i = 0; i < this.missileBonusScore / 10; i++) {
					ctx.strokeStyle = "#ff0000";
					ctx.lineWidth = 5;
					ctx.beginPath();
					ctx.moveTo(this.game.ctx.canvas.width / 2 + xPos, this.game.ctx.canvas.height / 2 + 40 - 12);
					ctx.lineTo(this.game.ctx.canvas.width / 2 + xPos, this.game.ctx.canvas.height / 2 + 40 + 12);
					ctx.stroke();
					xPos += 9;
				}
			}

			ctx.save();
			ctx.translate(0, ctx.canvas.height);
			ctx.scale(1, -1);
		}
	}, {
		key: 'drawLandscape',
		value: function drawLandscape(ctx) {
			ctx.drawImage(this.game.landscapeImage, 0, 0);
		}
	}, {
		key: 'drawMissileIndicators',
		value: function drawMissileIndicators(ctx) {
			for (var i = 0; i < this.game.launchpads.length; i++) {
				this.game.launchpads[i].drawMissileIndicators(ctx);
			}
		}
	}]);

	return _class;
}();

exports.default = _class;

},{"../entities/City":3}],16:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _class = function () {
	function _class(game, wave) {
		_classCallCheck(this, _class);

		this.game = game;
		this.wave = wave;
		this.opacity = 0.1;
		this.toggle = true;
		this.timer = 0;
		this.updates = 0;
		this.game.audioplayer.play('incoming');
	}

	_createClass(_class, [{
		key: 'update',
		value: function update() {
			this.timer += this.game.clockTick;
			var toggle = this.toggle ? this.opacity < 1 ? this.opacity += 0.05 : this.toggle = !this.toggle : this.opacity > 0.05 ? this.opacity -= 0.05 : this.toggle = !this.toggle;

			if (this.timer > 1) {
				this.timer = 0;
				this.updates += 1;
				this.game.audioplayer.play('incoming');
			}

			if (this.updates > 3) {
				this.game.startgame();
			}
		}
	}, {
		key: 'draw',
		value: function draw(ctx) {
			this.game.score.draw();
			ctx.restore();
			ctx.strokeStyle = '#ffffff';
			ctx.fillStyle = '#000000';
			ctx.lineWidth = 1;
			ctx.textBaseline = 'middle';
			ctx.textAlign = 'center';
			ctx.font = '40px Arial';
			ctx.fillText('Wave ' + this.wave, ctx.canvas.width / 2, ctx.canvas.height / 2 - 20);
			ctx.strokeText('Wave ' + this.wave, ctx.canvas.width / 2, ctx.canvas.height / 2 - 20);
			ctx.fillStyle = "rgba(255, 0, 0, " + this.opacity + ")";
			ctx.font = '20px Arial';
			ctx.fillText('Incoming', ctx.canvas.width / 2, ctx.canvas.height / 2 + 20);
		}
	}]);

	return _class;
}();

exports.default = _class;

},{}],17:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _class = function () {
	function _class(game) {
		_classCallCheck(this, _class);

		this.game = game;
		this.game.ASSET_MANAGER.queueDownload('images/City.png');
		this.game.ASSET_MANAGER.queueDownload('images/missile-indicator.png');
		this.game.ASSET_MANAGER.queueSound('explosion', 'sounds/8-bit-explosion.wav');
		this.game.ASSET_MANAGER.queueSound('launch', 'sounds/launch-sound.wav');
		this.game.ASSET_MANAGER.queueSound('bullet-ping', 'sounds/bullet-left-ping.wav');
		this.game.ASSET_MANAGER.queueSound('city-ping', 'sounds/city-left-ping.wav');
		this.game.ASSET_MANAGER.queueSound('incoming', 'sounds/incoming.mp3');
		this.queued = null;
		this.loaded = 0;
		this.init();
	}

	_createClass(_class, [{
		key: 'init',
		value: function init() {
			var _this = this;

			this.queued = this.game.ASSET_MANAGER.downloadAll(function () {
				_this.game.audioplayer.init();
				_this.game.gameloaded();
			}, this.itemLoaded.bind(this));
		}
	}, {
		key: 'update',
		value: function update() {}
	}, {
		key: 'itemLoaded',
		value: function itemLoaded(queued, loaded) {
			this.loaded = loaded;
			this.queued = queued;
		}
	}, {
		key: 'draw',
		value: function draw(ctx) {
			ctx.beginPath();
			ctx.strokeStyle = '#ffffff';
			ctx.fillStyle = '#000000';
			ctx.lineWidth = 1;
			ctx.rect(48, ctx.canvas.height / 2 - 22, ctx.canvas.width - 98, 14);
			ctx.stroke();

			ctx.beginPath();
			ctx.fillStyle = "#ffffff";
			ctx.rect(50, ctx.canvas.height / 2 - 20, (ctx.canvas.width - 100) / (this.queued / this.loaded), 10);
			ctx.fill();

			ctx.restore();
			ctx.strokeStyle = '#ffffff';
			ctx.fillStyle = '#000000';
			ctx.lineWidth = 1;
			ctx.textBaseline = 'middle';
			ctx.textAlign = 'center';
			ctx.font = '40px Arial';
			ctx.fillText('LOADING', ctx.canvas.width / 2, ctx.canvas.height / 2 - 20);
			ctx.strokeText('LOADING', ctx.canvas.width / 2, ctx.canvas.height / 2 - 20);
		}
	}]);

	return _class;
}();

exports.default = _class;

},{}],18:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _MissileLauncher = require('../objects/MissileLauncher');

var _MissileLauncher2 = _interopRequireDefault(_MissileLauncher);

var _City = require('../entities/City');

var _City2 = _interopRequireDefault(_City);

var _PlayerMissile = require('../entities/PlayerMissile');

var _PlayerMissile2 = _interopRequireDefault(_PlayerMissile);

var _EnemyMissile = require('../entities/EnemyMissile');

var _EnemyMissile2 = _interopRequireDefault(_EnemyMissile);

var _EnemySmartMissile = require('../entities/EnemySmartMissile');

var _EnemySmartMissile2 = _interopRequireDefault(_EnemySmartMissile);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _class = function () {
	function _class(game, wave) {
		_classCallCheck(this, _class);

		this.game = game;

		this.wave = wave;
		this.maxMissilesInPlay = null;
		this.timeBetweenRelease = null;
		this.maxMissileRelease = null;
		this.missilesToRelease = null;
		this.launchSpeed = null;
		this.onTarget = { list: [true, false], weight: [0.9, 0.1] };
		this.splitLaunch = { list: [true, false], weight: [0.2, 0.8] };

		this.setupLevel(this.wave);

		this.game.launchpads = [];
		this.timer = 0;
		//Setup launchpads
		this.game.launchpads[0] = new _MissileLauncher2.default(game, 20, 40);
		this.game.addEntity(this.game.launchpads[0]);
		this.game.launchpads[1] = new _MissileLauncher2.default(game, this.game.ctx.canvas.width / 2, 40);
		this.game.addEntity(this.game.launchpads[1]);
		this.game.launchpads[2] = new _MissileLauncher2.default(game, this.game.ctx.canvas.width - 20, 40);
		this.game.addEntity(this.game.launchpads[2]);
		//Setup cities
		for (var i = 0; i < this.game.cities.info.length; i++) {
			if (this.game.cities.info[i].isAlive) {
				var city = this.game.cities.info[i];
				city.instance = new _City2.default(this.game, city.x, city.y, i);
				this.game.addEntity(city.instance);
			}
		}
	}

	_createClass(_class, [{
		key: 'setupLevel',
		value: function setupLevel(wave) {

			//this.maxMissilesInPlay  = [8  ,8  ,8  ,8  ,10  ,10  ,10  ,10  ,12 ,12 ,12 ,12 ,14  ,14  ,14  ,14  ,16  ,16  ,16  ,16][wave-1];
			this.maxMissilesInPlay = function () {
				return Math.min(6 + Math.ceil(wave / 4) * 2, 20);
			}(wave);

			//this.timeBetweenRelease = [3  ,3  ,3  ,3  ,2.5 ,2.5 ,2.5 ,2.5 ,2  ,2  ,2  ,2  ,1.5 ,1.5 ,1.5 ,1.5 ,1   ,1   ,1   ,1 ][wave-1];
			this.timeBetweenRelease = function () {
				return Math.max(3.5 - Math.ceil(wave / 4) * 0.5, 1);
			}(wave);

			//this.maxMissileRelease  = [4  ,4  ,4  ,4  ,6   ,6   ,6   ,6   ,8  ,8  ,8  ,8  ,8   ,8   ,8   ,8   ,8   ,8   ,8   ,8 ][wave-1];
			this.maxMissileRelease = function () {
				return Math.min(2 + Math.ceil(wave / 4) * 2, 12);
			}(wave);

			//this.missilesToRelease  = [18 ,18 ,18 ,18 ,22  ,22  ,22  ,22  ,24 ,24 ,24 ,24 ,26  ,26  ,26  ,26  ,28  ,28  ,30  ,30][wave-1];
			this.missilesToRelease = function () {
				return Math.min(16 + Math.ceil(wave / 2) * 2, 30);
			}(wave);
			//this.launchSpeed		= [20 ,25 ,30 ,35 ,40  ,45  ,50  ,55  ,60 ,65 ,70 ,75 ,80  ,85  ,90  ,95  ,100 ,105 ,110 ,120][wave-1];
			this.launchSpeed = function () {
				return Math.min(wave * 10 + 20, 150);
			}(wave);
		}
	}, {
		key: 'rand',
		value: function rand(min, max) {
			return Math.random() * (max - min) + min;
		}
	}, {
		key: 'getRandomItem',
		value: function getRandomItem(list, weight) {
			var total_weight = weight.reduce(function (prev, cur, i, arr) {
				return prev + cur;
			});

			var random_num = this.rand(0, total_weight);
			var weight_sum = 0;

			for (var i = 0; i < list.length; i++) {
				weight_sum += weight[i];
				weight_sum = +weight_sum.toFixed(2);

				if (random_num <= weight_sum) {
					return list[i];
				}
			}
		}
	}, {
		key: 'update',
		value: function update() {
			var _this = this;

			this.timer += this.game.clockTick;
			var launchStart = null;
			var launchTarget = null;

			//Launch a player missile on click or touch
			if (this.game.click) {
				this.launchPlayerMissile();
			}

			//Launch some missiles
			if (this.timer > this.timeBetweenRelease && this.missilesToRelease > 0) {

				var targetlist = [];
				var missilelist = [];
				var splitLaunch = this.getRandomItem(this.splitLaunch.list, this.splitLaunch.weight);

				//Gather list of targets
				for (var i = 0; i < this.game.entities.length; i++) {
					if (this.game.entities[i] instanceof _City2.default || this.game.entities[i] instanceof _MissileLauncher2.default) {
						targetlist.push(this.game.entities[i]);
					}
					if (this.game.entities[i] instanceof _EnemyMissile2.default) {
						if (this.game.entities[i].x > this.game.ctx.canvas.height / 3) {
							missilelist.push(this.game.entities[i]);
						}
					}
				}

				this.timer = 0;

				if (missilelist.length && splitLaunch) {

					var filteredMissileList = missilelist.filter(function (object) {
						return object.y > _this.game.ctx.canvas.height / 2;
					});

					var selection = filteredMissileList[Math.floor(Math.random() * filteredMissileList.length - 1) + 1];
					launchStart = selection != undefined ? { x: selection.x, y: selection.y } : false;
				} else {
					launchStart = false;
				}

				var launchQuantity = this.maxMissilesInPlay - this.game.missilesInPlay;
				launchQuantity = launchQuantity > this.maxMissileRelease ? this.maxMissileRelease : launchQuantity < this.missilesToRelease ? launchQuantity : this.missilesToRelease;

				this.missilesToRelease -= launchQuantity;

				for (var _i = 0; _i < launchQuantity; _i++) {

					if (!launchStart) {
						launchStart = { x: Math.floor(Math.random() * this.game.ctx.canvas.width) + 1, y: this.game.ctx.canvas.height };
					}

					if (this.getRandomItem(this.onTarget.list, this.onTarget.weight)) {
						var _selection = targetlist[Math.floor(Math.random() * targetlist.length - 1) + 1];
						launchTarget = { x: _selection.x, y: _selection.y };
					} else {
						launchTarget = { x: Math.floor(Math.random() * this.game.ctx.canvas.width) + 1, y: 10 };
					}

					this.game.missilesInPlay += 1;
					var enemyMissile = new _EnemySmartMissile2.default(this.game, launchTarget.x, launchTarget.y, launchStart.x, launchStart.y, this.launchSpeed);
					this.game.addEntity(enemyMissile);

					if (!splitLaunch) {
						launchStart = false;
					}
				}
			}

			//Run out of missiles
			if (this.game.launchpads[0].missiles < 1 && this.game.launchpads[1].missiles < 1 && this.game.launchpads[2].missiles < 1) {
				this.missilesToRelease = 0;
				this.game.speedMultiplier = true;
			}

			//No entities on screen apart from cities and wave over or missiles used
			if (this.game.speedMultiplier || this.missilesToRelease < 1) {
				var complete = false;

				if (this.game.entities.length) {
					for (var k = 0; k < this.game.entities.length; k++) {
						if (this.game.entities[k] instanceof _City2.default || this.game.entities[k] instanceof _MissileLauncher2.default) {
							complete = true;
						} else {
							complete = false;
						}
					}
				} else {
					complete = true;
				}
				if (complete) {
					this.game.speedMultiplier = false;
					this.game.levelover(this.game, this.landscapeImage, this.launchpads);
				}
			}
		}
	}, {
		key: 'draw',
		value: function draw(ctx) {
			ctx.drawImage(this.game.background, 0, 0);
			this.game.score.draw();
		}
	}, {
		key: 'launchPlayerMissile',
		value: function launchPlayerMissile() {
			var launcherIndex = null,
			    distance = null,
			    missile = null,
			    click = this.game.click,
			    canvas = this.game.ctx.canvas;

			for (var i = 0; i < this.game.launchpads.length; i++) {
				var currentDistance = this.game.launchpads[i].getDistance(click.x, click.y, this.game.scale);

				if ((currentDistance < distance || distance === null) && this.game.launchpads[i].missiles > 0) {
					distance = currentDistance;
					launcherIndex = i;
				}
			}

			if (distance != null) {
				this.game.launchpads[launcherIndex].missiles -= 1;
				this.game.audioplayer.play('launch');
				missile = new _PlayerMissile2.default(this.game, click.x / this.game.scale, canvas.height - click.y / this.game.scale, this.game.launchpads[launcherIndex].x, this.game.launchpads[launcherIndex].y);
				this.game.addEntity(missile);
			}
		}
	}]);

	return _class;
}();

exports.default = _class;

},{"../entities/City":3,"../entities/EnemyMissile":4,"../entities/EnemySmartMissile":5,"../entities/PlayerMissile":8,"../objects/MissileLauncher":11}],19:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Easing = require('../objects/Easing');

var _Easing2 = _interopRequireDefault(_Easing);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _class = function () {
	function _class(game) {
		_classCallCheck(this, _class);

		this.game = game;
		this.characters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '.', ' ', 'DEL', 'END'];
		this.buttons = [];
		this.entry = '';
		this.entryAllowed = true;
		this.init();
	}

	_createClass(_class, [{
		key: 'init',
		value: function init() {
			var i = void 0,
			    j = void 0,
			    temp = void 0,
			    chunk = 8,
			    row = 0;
			var xOffset = (this.game.ctx.canvas.width - 46 * 8) / 2;
			var yOffset = (this.game.ctx.canvas.height - 46 * 4) / 2;

			for (i = 0, j = this.characters.length; i < j; i += chunk) {
				temp = this.characters.slice(i, i + chunk);

				for (var k = 0; k < temp.length; k++) {
					this.buttons.push({
						x1: k * 46 + xOffset,
						y1: row * 46 + yOffset * 1.5,
						width: 46,
						height: 46,
						pressed: false,
						fillOpacity: 0,
						timer: 0,
						label: temp[k]
					});
				}
				row += 1;
			}
		}
	}, {
		key: 'update',
		value: function update() {
			if (this.game.click) {
				var click = this.game.click;
				var scale = this.game.scale;

				for (var i = 0; i < this.buttons.length; i++) {
					var btn = this.buttons[i];

					if (click.x / scale >= btn.x1 && click.x / scale <= btn.x1 + btn.width && click.y / scale >= btn.y1 && click.y / scale <= btn.y1 + btn.height) {
						btn.pressed = true;
						btn.timer = 0;
						this.updateEntry(btn.label);
					}
				}
			}

			for (var _i = 0; _i < this.buttons.length; _i++) {
				var _btn = this.buttons[_i];

				if (_btn.pressed) {

					_btn.fillOpacity = 1 - _Easing2.default.easeOutQuad(_btn.timer, 0, 1, 1.5);
					_btn.timer += this.game.clockTick;
					if (_btn.timer > 1.5) {
						_btn.timer = 0;
						_btn.pressed = false;
						_btn.fillOpacity = 0;
					}
				}
			}
		}
	}, {
		key: 'updateEntry',
		value: function updateEntry(char) {
			switch (char) {
				case 'DEL':
					this.entry = this.entry.slice(0, -1);
					this.entryAllowed = true;
					break;
				case 'END':
					this.game.score.addHighScore(this.entry);
					this.game.levelreset();
					break;
				default:
					if (this.entry.length < 10) {
						this.entry += char;
						this.entryAllowed = this.entry.length < 10 ? true : false;
					}
			}
		}
	}, {
		key: 'draw',
		value: function draw(ctx) {
			ctx.save();
			ctx.translate(0, ctx.canvas.height);
			ctx.scale(1, -1);

			ctx.fillStyle = "#fff";
			ctx.strokeStyle = "#fff";
			ctx.lineWidth = 1;
			ctx.font = "16px Arial";
			ctx.textAlign = 'center';
			ctx.fillText('Top Defending, Enter Your Name!', ctx.canvas.width / 2, 30);
			ctx.font = "24px Arial";
			ctx.textAlign = 'center';
			ctx.fillText(this.entry, ctx.canvas.width / 2, 60);
			for (var i = 0; i < this.buttons.length; i++) {
				var btn = this.buttons[i];
				ctx.beginPath();
				ctx.fillStyle = 'rgba(255, 255, 255, ' + btn.fillOpacity + ')';
				ctx.rect(btn.x1, btn.y1, btn.width, btn.height);
				ctx.fill();
				ctx.stroke();

				if (this.entryAllowed || btn.label == 'DEL' || btn.label == 'END') {
					ctx.font = "16px Arial";
					ctx.fillStyle = "#fff";
					ctx.fillText(btn.label, btn.x1 + btn.width / 2, btn.y1 + btn.height / 2);
				}
			}
			ctx.restore();
		}
	}]);

	return _class;
}();

exports.default = _class;

},{"../objects/Easing":10}],20:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _class = function () {
	function _class(game) {
		var _this = this;

		_classCallCheck(this, _class);

		this.game = game;
		this.opacity = 0.1;
		this.toggle = true;
		this.display = true;
		this.timer = 0;

		window.addEventListener('touchstart', function () {
			if (!_this.game.soundUnlock) {
				_this.game.audioplayer.unlock();
				_this.game.soundUnlock = true;
				window.removeEventListener('touchstart');
			}
		});
	}

	_createClass(_class, [{
		key: 'update',
		value: function update() {
			var toggle = this.toggle ? this.opacity < 1 ? this.opacity += 0.01 : this.toggle = !this.toggle : this.opacity > 0 ? this.opacity -= 0.01 : this.toggle = !this.toggle;
			this.timer += this.game.clockTick;

			if (this.timer > 10) {
				this.timer = 0;
				this.display = !this.display;
			}

			if (this.game.click) {
				this.game.click = null;
				this.game.levelup(); // Fire FSM startgame event;
			}
		}
	}, {
		key: 'draw',
		value: function draw(ctx) {
			if (this.display) {
				ctx.restore();
				ctx.strokeStyle = '#ffffff';
				ctx.fillStyle = '#000000';
				ctx.lineWidth = 1;
				ctx.textBaseline = 'middle';
				ctx.textAlign = 'center';
				ctx.font = '40px Arial';
				ctx.fillText('Ballistic Defence', ctx.canvas.width / 2, ctx.canvas.height / 2 - 20);
				ctx.strokeText('Ballistic Defence', ctx.canvas.width / 2, ctx.canvas.height / 2 - 20);
				ctx.fillStyle = "rgba(255, 255, 255, " + this.opacity + ")";
				ctx.font = '20px Arial';
				ctx.fillText('click or touch to start', ctx.canvas.width / 2, ctx.canvas.height / 2 + 20);
			} else {
				this.game.score.drawHighScores();
				ctx.save();
				ctx.translate(0, ctx.canvas.height);
				ctx.scale(1, -1);
				ctx.fillStyle = "rgba(255, 255, 255, " + this.opacity + ")";
				ctx.font = '20px Arial';
				ctx.fillText('click or touch to start', ctx.canvas.width / 2, ctx.canvas.height - 80);
				ctx.restore();
			}
		}
	}]);

	return _class;
}();

exports.default = _class;

},{}],21:[function(require,module,exports){
'use strict';

var _BalisticDefence = require('./game/BalisticDefence');

var _BalisticDefence2 = _interopRequireDefault(_BalisticDefence);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var canvas = document.getElementById('view');
var ctx = canvas.getContext('2d');

//Detect iPhone
if (navigator.userAgent.match(/iPhone/i)) {
	canvas.width = window.innerHeight;
}

var game = new _BalisticDefence2.default();

game.init(ctx);

console.log(game);

},{"./game/BalisticDefence":2}],22:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _class = function () {
	function _class() {
		_classCallCheck(this, _class);

		this.successCount = 0;
		this.errorCount = 0;
		this.cache = {};
		this.downloadQueue = [];
		this.soundsQueue = [];
	}

	_createClass(_class, [{
		key: "queueDownload",
		value: function queueDownload(path) {
			this.downloadQueue.push(path);
		}
	}, {
		key: "queueSound",
		value: function queueSound(id, path) {
			this.soundsQueue.push({ id: id, path: path });
		}
	}, {
		key: "downloadAll",
		value: function downloadAll(downloadCallback, itemLoaded) {
			var _this = this;

			if (this.downloadQueue.length === 0) {
				downloadCallback();
			}

			this.downloadSounds(downloadCallback, itemLoaded);

			for (var i = 0; i < this.downloadQueue.length; i++) {

				var path = this.downloadQueue[i];
				var img = new Image();

				img.addEventListener("load", function () {
					_this.successCount += 1;
					if (_this.isDone()) {
						itemLoaded(_this.downloadQueue.length + _this.soundsQueue.length, _this.successCount + _this.errorCount);
						downloadCallback();
					} else {
						if (typeof itemLoaded === 'function') {
							itemLoaded(_this.downloadQueue.length + _this.soundsQueue.length, _this.successCount + _this.errorCount);
						}
					}
				}, false);

				img.addEventListener("error", function () {
					_this.errorCount += 1;
					if (_this.isDone()) {
						downloadCallback();
					}
				}, false);

				img.src = path;
				this.cache[path] = img;
			}

			return this.downloadQueue.length + this.soundsQueue.length;
		}
	}, {
		key: "downloadSounds",
		value: function downloadSounds(downloadCallback, itemLoaded) {
			var _this2 = this;

			var AudioContext = window.AudioContext || window.webkitAudioContext;
			var audioctx = new AudioContext();

			var _loop = function _loop(i) {
				var id = _this2.soundsQueue[i].id;
				var request = new XMLHttpRequest();
				request.open('get', _this2.soundsQueue[i].path, true);
				request.responseType = 'arraybuffer';
				request.onload = function () {
					audioctx.decodeAudioData(request.response, function (buffer) {

						_this2.successCount += 1;
						_this2.cache[id] = buffer;
						if (_this2.isDone()) {
							itemLoaded(_this2.downloadQueue.length + _this2.soundsQueue.length, _this2.successCount + _this2.errorCount);
							downloadCallback();
						} else {
							if (typeof itemLoaded === 'function') {
								itemLoaded(_this2.downloadQueue.length + _this2.soundsQueue.length, _this2.successCount + _this2.errorCount);
							}
						}
					});
				};
				request.onerror = function () {
					_this2.errorCount += 1;
					if (_this2.isDone()) {
						downloadCallback();
					}
				};
				request.send();
			};

			for (var i = 0; i < this.soundsQueue.length; i++) {
				_loop(i);
			}
		}
	}, {
		key: "getAsset",
		value: function getAsset(path) {
			return this.cache[path];
		}
	}, {
		key: "isDone",
		value: function isDone() {
			return this.downloadQueue.length + this.soundsQueue.length === this.successCount + this.errorCount;
		}
	}]);

	return _class;
}();

exports.default = _class;

},{}],23:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _class = function () {
	function _class(assets_manager) {
		_classCallCheck(this, _class);

		var AudioContext = window.AudioContext || window.webkitAudioContext;

		this.asset_manager = assets_manager;
		this.audioctx = new AudioContext();
		this.buffers = {};
	}

	_createClass(_class, [{
		key: "init",
		value: function init() {
			for (var prop in this.asset_manager.cache) {
				if (this.asset_manager.cache[prop] instanceof AudioBuffer) {
					this.buffers[prop] = this.asset_manager.cache[prop];
				}
			}
		}
	}, {
		key: "unlock",
		value: function unlock() {
			// Enable audio in iOS
			var buffer = this.audioctx.createBuffer(1, 1, 22050);
			var source = this.audioctx.createBufferSource();
			source.buffer = buffer;

			source.connect(this.audioctx.destination);

			source.noteOn(0);
		}
	}, {
		key: "play",
		value: function play(id) {

			var sound = this.audioctx.createBufferSource();
			sound.buffer = this.buffers[id];
			sound.connect(this.audioctx.destination);
			sound.start(this.audioctx.currentTime);
			sound.stop(this.audioctx.currentTime + this.buffers[id].duration);
		}
	}]);

	return _class;
}();

exports.default = _class;

},{}],24:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _GameTimer = require('./GameTimer');

var _GameTimer2 = _interopRequireDefault(_GameTimer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _class = function () {
	function _class() {
		_classCallCheck(this, _class);

		this.entities = [];
		this.ctx = null;
		this.click = null;
		this.timer = new _GameTimer2.default();
		this.surfaceWidth = null;
		this.surfaceHeight = null;
		this.scale = null;
		this.clockTick = null;
	}

	_createClass(_class, [{
		key: 'init',
		value: function init(ctx) {
			this.ctx = ctx;
			this.surfaceWidth = this.ctx.canvas.width;
			this.surfaceHeight = this.ctx.canvas.height;
			this.setSurface();
			this.startInput();
		}
	}, {
		key: 'start',
		value: function start() {
			var _this = this;

			var gameLoop = function gameLoop() {
				_this.loop();
				requestAnimationFrame(gameLoop, _this.ctx.canvas);
			};
			gameLoop();
		}
	}, {
		key: 'setSurface',
		value: function setSurface() {
			var _this2 = this;

			var reflowStage = function reflowStage() {

				var scaleX = window.innerWidth / _this2.ctx.canvas.width;
				var scaleY = window.innerHeight / _this2.ctx.canvas.height;
				var scale = Math.min(scaleX, scaleY);

				var offsetY = (window.innerHeight - _this2.ctx.canvas.height * scale) / 2;
				var offsetX = (window.innerWidth - _this2.ctx.canvas.width * scale) / 2;

				_this2.scale = scale;

				_this2.ctx.canvas.parentNode.parentNode.style.top = offsetY + 'px';
				_this2.ctx.canvas.parentNode.parentNode.style.left = offsetX + 'px';
				_this2.ctx.canvas.parentNode.style.webKitransform = 'scale(' + scale + ')';
				_this2.ctx.canvas.parentNode.style.transform = 'scale(' + scale + ')';
			};

			window.addEventListener('resize', reflowStage);

			window.addEventListener('orientationchage', reflowStage);

			reflowStage();
		}
	}, {
		key: 'startInput',
		value: function startInput() {
			var _this3 = this;

			var getXandY = function getXandY(e) {
				var x = e.clientX - _this3.ctx.canvas.getBoundingClientRect().left;
				var y = e.clientY - _this3.ctx.canvas.getBoundingClientRect().top;

				return { x: x, y: y };
			};

			var getTouchXandTouchY = function getTouchXandTouchY(e) {
				var x = e.targetTouches[0].pageX - _this3.ctx.canvas.getBoundingClientRect().left;
				var y = e.targetTouches[0].pageY - _this3.ctx.canvas.getBoundingClientRect().top;

				return { x: x, y: y };
			};

			this.ctx.canvas.addEventListener('click', function (e) {
				_this3.click = getXandY(e);
			}, false);

			this.ctx.canvas.addEventListener('touchstart', function (e) {
				e.preventDefault();
				_this3.click = getTouchXandTouchY(e);
			});
		}
	}, {
		key: 'loop',
		value: function loop() {
			this.clockTick = this.timer.tick();
			this.update();
			this.draw();
			this.click = null;
		}
	}, {
		key: 'addEntity',
		value: function addEntity(entity) {
			this.entities.push(entity);
		}
	}, {
		key: 'draw',
		value: function draw(drawCallback) {
			this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
			this.ctx.save();
			this.ctx.translate(0, this.ctx.canvas.height);
			this.ctx.scale(1, -1);

			if (drawCallback) {
				drawCallback(this);
			}

			for (var i = 0; i < this.entities.length; i++) {
				this.entities[i].draw(this.ctx);
			}

			this.ctx.restore();
		}
	}, {
		key: 'update',
		value: function update() {
			var entitiesCount = this.entities.length;

			for (var i = 0; i < entitiesCount; i++) {
				var entity = this.entities[i];

				if (!entity.removeFromWorld) {
					entity.update();
				}
			}

			for (var _i = this.entities.length - 1; _i >= 0; --_i) {
				if (this.entities[_i].removeFromWorld) {
					this.entities.splice(_i, 1);
				}
			}
		}
	}]);

	return _class;
}();

exports.default = _class;

},{"./GameTimer":26}],25:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _class = function () {
  function _class(game, x, y) {
    _classCallCheck(this, _class);

    this.game = game;
    this.x = x;
    this.y = y;
    this.removeFromWorld = false;
  }

  _createClass(_class, [{
    key: "update",
    value: function update() {}
  }, {
    key: "draw",
    value: function draw(ctx) {
      if (this.game.showOutlines && this.radius) {
        ctx.beginPath();
        ctx.strokeStyle = "red";
        ctx.lineWidth = 1;
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
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
  }]);

  return _class;
}();

exports.default = _class;

},{}],26:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _class = function () {
	function _class() {
		_classCallCheck(this, _class);

		this.gameTime = 0;
		this.maxStep = 0.05;
		this.wallLastTimestamp = 0;
		this.fps = 0;
	}

	_createClass(_class, [{
		key: "tick",
		value: function tick() {
			var wallCurrent = Date.now();
			var wallDelta = (wallCurrent - this.wallLastTimestamp) / 1000;

			this.fps = 1000 / (wallCurrent - this.wallLastTimestamp);
			this.wallLastTimestamp = wallCurrent;
			var gameDelta = Math.min(wallDelta, this.maxStep);

			this.gameTime += gameDelta;

			return gameDelta;
		}
	}]);

	return _class;
}();

exports.default = _class;

},{}],27:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.default = {
	activate: function activate(target) {
		var n = void 0,
		    max = void 0;

		target.subscribe = function (event, callback) {
			this.subscribers = this.subscribers || {};
			this.subscribers[event] = this.subscribers[event] || [];
			this.subscribers[event].push(callback);
		};

		target.publish = function (event) {
			if (this.subscribers && this.subscribers[event]) {
				var subs = this.subscribers[event],
				    args = [].slice.call(arguments, 1),
				    _n = void 0,
				    _max = void 0;

				for (_n = 0, _max = subs.length; _n < _max; _n++) {
					subs[_n].apply(target, args);
				}
			}
		};
	}
};

},{}]},{},[21]);
