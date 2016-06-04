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

var _javascriptStateMachine = require('javascript-state-machine');

var _javascriptStateMachine2 = _interopRequireDefault(_javascriptStateMachine);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var BalisticDefence = function (_GameEngine) {
	_inherits(BalisticDefence, _GameEngine);

	function BalisticDefence() {
		_classCallCheck(this, BalisticDefence);

		return _possibleConstructorReturn(this, Object.getPrototypeOf(BalisticDefence).call(this));
	}

	_createClass(BalisticDefence, [{
		key: 'init',
		value: function init(ctx) {
			_get(Object.getPrototypeOf(BalisticDefence.prototype), 'init', this).call(this, ctx);
			this.startup(); // Required by statemachine
		}
	}, {
		key: 'start',
		value: function start() {
			_get(Object.getPrototypeOf(BalisticDefence.prototype), 'start', this).call(this);
		}

		//State machine handlers

	}, {
		key: 'onentermenu',
		value: function onentermenu() {
			this.start();
		}
	}, {
		key: 'update',
		value: function update() {
			switch (this.current) {
				case 'menu':
					this.updateMenu();
					break;
			}
		}
	}, {
		key: 'updateMenu',
		value: function updateMenu() {
			if (this.click) {
				this.click = null;
				this.play();
			}
		}
	}, {
		key: 'draw',
		value: function draw() {
			var _this2 = this;

			_get(Object.getPrototypeOf(BalisticDefence.prototype), 'draw', this).call(this, function (game) {
				switch (_this2.current) {
					case 'menu':
						game.drawMenu(_this2.ctx);
						break;
				}
			});
		}
	}, {
		key: 'drawMenu',
		value: function drawMenu(ctx) {
			ctx.restore();
			ctx.strokeStyle = '#ffffff';
			ctx.fillStyle = '#ffffff';
			ctx.lineWidth = 2;
			ctx.textBaseline = 'middle';
			ctx.textAlign = 'center';
			ctx.font = '40px Arial';
			ctx.strokeText('BalisticDefense', ctx.canvas.width / 2, ctx.canvas.height / 2 - 20);
			ctx.font = '20px Arial';
			ctx.fillText('click or touch to start', ctx.canvas.width / 2, ctx.canvas.height / 2 + 20);
		}
	}]);

	return BalisticDefence;
}(_GameEngine3.default);

_javascriptStateMachine2.default.create({
	target: BalisticDefence.prototype,
	events: [{ name: 'startup', from: 'none', to: 'menu' }]
});

console.log(BalisticDefence);
exports.default = BalisticDefence;

},{"../lib/GameEngine":4,"javascript-state-machine":1}],3:[function(require,module,exports){
'use strict';

var _BalisticDefence = require('./game/BalisticDefence');

var _BalisticDefence2 = _interopRequireDefault(_BalisticDefence);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var canvas = document.getElementById('view');
var ctx = canvas.getContext('2d');

var game = new _BalisticDefence2.default();

game.init(ctx);

},{"./game/BalisticDefence":2}],4:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _GameTimer = require("./GameTimer");

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
	}

	_createClass(_class, [{
		key: "init",
		value: function init(ctx) {
			this.ctx = ctx;
			this.surfaceWidth = this.ctx.canvas.width;
			this.surfaceHeight = this.ctx.canvas.height;
			this.setSurface();
			this.startInput();
		}
	}, {
		key: "start",
		value: function start() {
			var _this = this;

			var gameLoop = function gameLoop() {
				_this.loop();
				requestAnimationFrame(gameLoop, _this.ctx.canvas);
			};
			gameLoop();
		}
	}, {
		key: "setSurface",
		value: function setSurface() {
			var _this2 = this;

			var reflowStage = function reflowStage() {
				console.log("reflow");
				console.log(_this2.ctx.canvas.parentNode);
				var scaleX = window.innerWidth / _this2.ctx.canvas.width;
				var scaleY = window.innerHeight / _this2.ctx.canvas.height;
				var scale = Math.min(scaleX, scaleY);
				_this2.scale = scale;

				_this2.ctx.canvas.parentNode.style.webkitTransform = "scale(" + scale + ")";
				_this2.ctx.canvas.parentNode.style.transform = "scale(" + scale + ")";
			};

			window.addEventListener('resize', reflowStage);

			window.addEventListener('orientationchage', reflowStage);

			reflowStage();
		}
	}, {
		key: "startInput",
		value: function startInput() {
			var _this3 = this;

			var getXandY = function getXandY(e) {
				var x = e.clientX - _this3.ctx.canvas.getBoundingClientRect().left;
				var y = e.clientY - _this3.ctx.canvas.getBoundingClientRect().top;

				return { x: x, y: y };
			};

			var getTouchXandTouchY = function getTouchXandTouchY(e) {
				var x = e.targetTouches[0].pageX - _this3.ctx.canvas.clientLeft;
				var y = e.targetTouches[0].pageY - _this3.ctx.canvas.clientTop;

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
		key: "loop",
		value: function loop() {
			this.clockTick = this.timer.tick();
			this.update();
			this.draw();
			this.click = null;
		}
	}, {
		key: "addEntity",
		value: function addEntity(entity) {
			this.entities.push(entity);
		}
	}, {
		key: "draw",
		value: function draw(drawCallback) {
			this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
			this.ctx.save();
			this.ctx.translate(0, this.ctx.canvas.height);
			this.ctx.scale(1, -1);

			for (var i = 0; i < this.entities.length; i++) {
				this.entities[i].draw(this.ctx);
			}

			if (drawCallback) {
				drawCallback(this);
			}

			this.ctx.restore();
		}
	}, {
		key: "update",
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

},{"./GameTimer":5}],5:[function(require,module,exports){
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
		this.max = 0.05;
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

},{}]},{},[3]);
