/* global Vue */
const loopTapApp = Vue.createApp({
    data() {
        return {
            arc: [180, 270],
            taps: 0,
            score: 0,
            best: parseInt(window.localStorage.best) || 0,
            state: "init",
            prevTapTime: 0,
            developerMode: false,
            developerPassword: '54188',
            fakeBest: parseInt(window.localStorage.best) || 0,
            developerSettings: {
                ballSize: 4,
                rotationSpeed: 2000,
                autoPlay: false
            },
            threeDMode: false,
            colors: [
                "#ED5565", "#D9444F", "#ED5F56", "#DA4C43", "#F87D52", 
                "#E7663F", "#FAB153", "#F59B43", "#FDCE55", "#F6BA43", 
                "#C2D568", "#B1C353", "#99D469", "#83C251", "#42CB70", 
                "#3CB85D", "#47CEC0", "#3BBEB0", "#4FC2E7", "#3CB2D9", 
                "#5C9DED", "#4C8CDC", "#9398EC", "#7277D5", "#CC93EF", 
                "#B377D9", "#ED87BF", "#D870AE",
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
                if (this.developerMode) {
                    if (this.score > this.fakeBest) {
                        this.fakeBest = this.score;
                        this.best = this.fakeBest;
                        window.localStorage.best = this.best;
                    }
                } else {
                    if (this.score > this.best) {
                        window.localStorage.best = this.best = this.score;
                    }
                }
            }
        },

        tap(e) {
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }
            if (this.state === "started") {
                const ballAngle = this.getBallAngle();
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

        updateBallSize(event) {
            const value = parseInt(event.target.value);
            if (!isNaN(value) && value >= 1 && value <= 10) {
                this.developerSettings.ballSize = value;
            }
        },

        updateRotationSpeed(event) {
            const value = parseInt(event.target.value);
            if (!isNaN(value) && value >= 500 && value <= 5000) {
                this.developerSettings.rotationSpeed = value;
            }
        },

        updateFakeBest(event) {
            const value = parseInt(event.target.value);
            if (!isNaN(value) && value >= 0) {
                this.fakeBest = value;
                this.best = value;
                window.localStorage.best = value;
            }
        },

        closeDeveloperMode() {
            this.developerMode = false;
        },

        toggleDeveloperMode() {
            const password = prompt('请输入开发者模式密码:');
            if (password === this.developerPassword) {
                this.developerMode = !this.developerMode;
            } else {
                alert('密码错误');
            }
        },

        toggleThreeDMode() {
            this.threeDMode = !this.threeDMode;
            this.applyThreeDMode();
        },

        applyThreeDMode() {
            const looptap = document.getElementById('looptap');
            const ball = document.getElementById('ball');
            const arc = document.getElementById('arc');

            if (this.threeDMode) {
                looptap.style.transform = 'perspective(500px) rotateX(45deg) rotateY(20deg) scale(1.2)';
                looptap.style.transition = 'transform 0.5s';
                ball.style.filter = 'drop-shadow(3px 3px 3px rgba(0,0,0,0.5))';
                arc.style.filter = 'drop-shadow(2px 2px 2px rgba(0,0,0,0.3))';
            } else {
                looptap.style.transform = 'none';
                ball.style.filter = 'none';
                arc.style.filter = 'none';
            }
        },

        resetDeveloperMode() {
            this.developerSettings = {
                ballSize: 4,
                rotationSpeed: 2000,
                autoPlay: false
            };
            this.threeDMode = false;
            this.applyThreeDMode();
            this.fakeBest = 0;
            this.best = 0;
            window.localStorage.best = 0;
        },

        autoPlay() {
            if (this.developerMode && this.developerSettings.autoPlay && this.state === "started") {
                const ballAngle = this.getBallAngle();
                if (ballAngle + 6 > this.arc[0] && ballAngle - 6 < this.arc[1]) {
                    this.tap();
                }
            }
        }
    },
    mounted() {
        setInterval(() => {
            this.autoPlay();
        }, 100);
    }
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
