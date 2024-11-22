/* global Vue */
const app = Vue.createApp({
  data() {
    return {
      state: 'init', // 状态：'init', 'started', 'stopped'
      score: 0,
      best: 0,
      taps: 0,
      colors: ['#1abc9c', '#2ecc71', '#3498db', '#9b59b6', '#e74c3c'],
      arcDValue: '', // 用于 SVG arc 的路径值
      language: 'en', // 当前语言，默认英文
      translations: {
        en: {
          tapAnywhere: 'Tap anywhere / press spacebar when',
          onColoredArea: 'the ball is on the colored area.',
          best: 'Best',
          shareYourScore: 'Share your score',
          madeBy: 'Looptap is made by',
        },
        zh: {
          tapAnywhere: '点击任意位置 / 按空格键',
          onColoredArea: '当球在彩色区域时。',
          best: '最高分',
          shareYourScore: '分享你的分数',
          madeBy: 'Looptap 制作于',
        },
      },
    };
  },
  computed: {
    translatedText() {
      return this.translations[this.language];
    },
  },
  methods: {
    startPlay() {
      this.state = 'started';
      this.score = 0;
      this.taps = 0;
    },
    changeLanguage() {
      this.language = this.language === 'en' ? 'zh' : 'en';
    },
  },
  mounted() {
    // 初始化 SVG arc 动画路径
    this.arcDValue = 'M50,50 L50,10 A40,40 0 1,1 10,50 Z';
  },
});

app.mount('#canvas');

const loopTapApp = Vue.createApp({
	data() {
		return {
			arc: [180, 270],
			taps: 0,
			score: 0,
			best: window.localStorage.best || 0,
			state: "init",
			prevTapTime: 0,
			colors: [
				"#ED5565",
				"#D9444F",
				"#ED5F56",
				"#DA4C43",
				"#F87D52",
				"#E7663F",
				"#FAB153",
				"#F59B43",
				"#FDCE55",
				"#F6BA43",
				"#C2D568",
				"#B1C353",
				"#99D469",
				"#83C251",
				"#42CB70",
				"#3CB85D",
				"#47CEC0",
				"#3BBEB0",
				"#4FC2E7",
				"#3CB2D9",
				"#5C9DED",
				"#4C8CDC",
				"#9398EC",
				"#7277D5",
				"#CC93EF",
				"#B377D9",
				"#ED87BF",
				"#D870AE",
			],
		};
	},
	computed: {
		arcDValue() {
			return this.describeArc(50, 50, 40, this.arc[0], this.arc[1]);
		},
	},
	methods: {
		polarToCartesian(centerX, centerY, radius, angleInDegrees) {
			const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
			return {
				x: centerX + radius * Math.cos(angleInRadians),
				y: centerY + radius * Math.sin(angleInRadians),
			};
		},

		describeArc(x, y, radius, startAngle, endAngle) {
			const start = this.polarToCartesian(x, y, radius, endAngle);
			const end = this.polarToCartesian(x, y, radius, startAngle);
			const arcFlag = endAngle - startAngle <= 180 ? "0" : "1";
			const d = ["M", start.x, start.y, "A", radius, radius, 0, arcFlag, 0, end.x, end.y].join(" ");
			return d;
		},

		getAngle(cx, cy, ex, ey) {
			const dy = ey - cy;
			const dx = ex - cx;
			let theta = Math.atan2(dx, -dy);
			theta *= 180 / Math.PI;
			theta = theta < 0 ? theta + 360 : theta;
			return theta;
		},

		getBallAngle() {
			const bg = document.getElementById("bg").getBoundingClientRect();
			const bgCenter = { x: bg.left + bg.width / 2, y: bg.top + bg.height / 2 };
			const ball = document.getElementById("ball").getBoundingClientRect();
			const ballCenter = { x: ball.left + ball.width / 2, y: ball.top + ball.height / 2 };
			return this.getAngle(bgCenter.x, bgCenter.y, ballCenter.x, ballCenter.y);
		},

		setArc() {
			const random = (i, j) => Math.floor(Math.random() * (j - i)) + i;
			let arc = [];
			arc.push(random(0, 300));
			arc.push(random(arc[0] + 10, arc[0] + 110));
			arc[1] = arc[1] > 360 ? 360 : arc[1];
			this.arc = arc;
		},

		startPlay() {
			this.state = "started";
			this.taps = 0;
			this.score = 0;
			this.prevTapTime = Date.now();
		},
		stopPlay() {
			if (this.state === "started") {
				this.state = "stopped";
				if (this.score > this.best) window.localStorage.best = this.best = this.score;
			}
		},

		tap(e) {
			e.preventDefault();
			e.stopPropagation();
			if (this.state === "started") {
				const ballAngle = this.getBallAngle();
				// adding a 6 for better accuracy as the arc stroke extends beyond the angle.
				if (ballAngle + 6 > this.arc[0] && ballAngle - 6 < this.arc[1]) {
					const currentTapTime = Date.now();
					const tapInterval = currentTapTime - this.prevTapTime;
					this.taps++;
					this.score = this.score + (tapInterval < 500 ? 5 : tapInterval < 1000 ? 2 : 1);
					this.prevTapTime = currentTapTime;
					this.setArc();
				} else this.stopPlay();
			}
		},
	},
}).mount("#canvas");

if ("ontouchstart" in window) {
	window.addEventListener("touchstart", loopTapApp.tap);
} else {
	window.addEventListener("mousedown", loopTapApp.tap);
	window.onkeypress = (e) => {
		if (e.keyCode == 32) {
			if (loopTapApp.state === "stopped") {
				loopTapApp.startPlay();
			} else {
				loopTapApp.tap(e);
			}
		}
	};
}

if ("serviceWorker" in navigator) {
	navigator.serviceWorker.register("/sw.js");
}
