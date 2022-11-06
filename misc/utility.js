// Utility functions for paper.js generative art
paper = paper && Object.prototype.hasOwnProperty.call(paper, 'default') ? paper['default'] : paper;

let utils = {
	// Mathematical helpers -----------------------------------------
    isEven: function(n){
        return n % 2 == 0;
    },
    isOdd: function(n){
        return !this.isEven(n);
    },
	getRandomInt: function(min, max) {
		return Math.floor(Math.random() * Math.floor(max-min)) + min;
	},
	getDifference: function(a, b) {
		return Math.abs(a - b);
	},
	noise: function(phase) {
		return (perlin.get(phase, phase))  // requires perlin.js http://joeiddon.github.io/perlin/perlin.js
	},	
	maybe: function() {
		var result = false
		if (Math.random() > 0.5) result = true
		return result
	},
	plusminus: function() {
		var plusOrMinus = Math.random() < 0.5 ? -1 : 1;
		return plusOrMinus;
	},
	sinBetween: function(min, max, t) {
		return ((max - min) * Math.sin(t) + max + min) / 2.
	},
	// Get an array of random numbers sorted in order
	pick: function(n, min, max) {
		var results = [];
		for (i = 1; i <= n; i++) {
			var value = Math.floor(Math.random() * max + min);
			results.push(value);
		}
		return results.sort(function(a, b){return a-b});
	},

	// Vector drawing calculations -----------------------------------------
	between: function(p1, p2, r = 0.5) {
		var tmpLine = new paper.Path.Line({
			from: p1,
			to: p2
		})
		var result = tmpLine.getPointAt(tmpLine.length * r)
		tmpLine.remove()
		return result
	},
	normal: function(path, loc, value) {
		var vector = path.getNormalAt(loc) * value;
		return vector;
	},

	// Color  -----------------------------------------
	hex2color: function(hex) {
		var t =  hex.match(/[A-Za-z0-9]{2}/g).map(function(v) { return parseInt(v, 16)/255 });
		var c = new paper.Color(t);
		return c;
	},
	componentToHex: function(c) {
		var hex = parseInt(c*255).toString(16);
		var padding = typeof (padding) === "undefined" || padding === null ? padding = 2 : padding;
	
		while (hex.length < padding) {
			hex = "0" + hex;
		}
		return hex;
	},
	rgb2hex: function(r, g, b) {
		return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
	},
	invertColor: function(color) {
		if (color != null) {
			color.red = 1 - color.red;
			color.green = 1 - color.green;
			color.blue = 1 - color.blue;
			return color;
		}
	},
	rgbArray2Color: function(rgbarr) {
		var c = new Color(rgbarr[0]/255, rgbarr[1]/255, rgbarr[2]/255);
		return c;
	},

	// String manipulation -------------------------------------------------
	pad: function(num, size) {
		num = num.toString();
		while (num.length < size) num = "0" + num;
		return num;
	},

	// Animation related functions -----------------------------------------
	easingAnims: function (min, max, easing, phase) {
		phase = animFrame / (document.getElementById('animSpeed').value * 10);
		var animValue = eval(easing + '(phase)');
		var range = max - min;
		if (phase >= 1) {animDir = 0}  // requires global animDir variable to be set
		if (phase <= 0) {animDir = 1};
		return parseInt(min) + parseFloat(animValue * range);
	},

	// Easing functions -----------------------------------------
	sine: function(x) {
		return Math.sin(x);
	},
	easeInOutCirc: function (x) {
		return x < 0.5
			? (1 - Math.sqrt(1 - Math.pow(2 * x, 2))) / 2
			: (Math.sqrt(1 - Math.pow(-2 * x + 2, 2)) + 1) / 2;
	},
	easeInOutElastic: function (x) {
		var c5 = (2 * Math.PI) / 4.5;
		return x === 0
			? 0
			: x === 1
				? 1
				: x < 0.5
					? -(Math.pow(2, 20 * x - 10) * Math.sin((20 * x - 11.125) * c5)) / 2
					: (Math.pow(2, -20 * x + 10) * Math.sin((20 * x - 11.125) * c5)) / 2 + 1;
	},
	easeOutElastic: function (x) {
		var c4 = (2 * Math.PI) / 3;
		return x === 0
			? 0
			: x === 1
				? 1
				: Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
	},
	easeOutBounce: function (x) {
		var n1 = 7.5625;
		var d1 = 2.75;
		if (x < 1 / d1) {
			return n1 * x * x;
		}
		else if (x < 2 / d1) {
			return n1 * (x -= 1.5 / d1) * x + 0.75;
		}
		else if (x < 2.5 / d1) {
			return n1 * (x -= 2.25 / d1) * x + 0.9375;
		}
		else {
			return n1 * (x -= 2.625 / d1) * x + 0.984375;
		}
	},
	easeInOutBounce: function (x) {
		return x < 0.5
		  ? (1 - easeOutBounce(1 - 2 * x)) / 2
		  : (1 + easeOutBounce(2 * x - 1)) / 2;
	},
	easeInOutExpo: function (x) {
		return x === 0
			? 0
			: x === 1
				? 1
				: x < 0.5 ? Math.pow(2, 20 * x - 10) / 2
					: (2 - Math.pow(2, -20 * x + 10)) / 2;
	},
	easeInBack: function (x) {
		var c1 = 1.70158;
		var c3 = c1 + 1;
		return c3 * x * x * x - c1 * x * x;
	},
	easeInExpo: function (x) {
		return x === 0 ? 0 : Math.pow(2, 10 * x - 10);
	},
	easeInOutBack: function (x) {
		var c1 = 1.70158;
		var c2 = c1 * 1.525;
		return x < 0.5
			? (Math.pow(2 * x, 2) * ((c2 + 1) * 2 * x - c2)) / 2
			: (Math.pow(2 * x - 2, 2) * ((c2 + 1) * (x * 2 - 2) + c2) + 2) / 2;
	},
	easeInQuart: function (x) {
		return x * x * x * x;
	},
	  easeInOutSine: function (x) {
		return -(Math.cos(Math.PI * x) - 1) / 2;
	}
}
