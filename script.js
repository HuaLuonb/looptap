/* global Vue */

const loopTapApp = Vue.createApp({
    data() {
        return {
            arc: [180, 270],
            taps: 0,
            score: 0,
            best: window.localStorage.best || 0,
            state: "init",
            prevTapTime: 0,
            debugMode: true,
            debugSettings: {
                maxScore: 1000,
                minScore: 0,
                ballSize: 4,
                rotationSpeed: 2000,
                enable3DMode: false,
                tapTolerance: 30
            },
            colors: [
                "#ED5565", "#D9444F", "#ED5F56", "#DA4C43", "#F87D52", 
                "#E7663F", "#FAB153", "#F59B43", "#FDCE55", "#F6BA43", 
                "#C2D568", "#B1C353", "#99D469", "#83C251", "#42CB70", 
                "#3CB85D", "#47CEC0", "#3BBEB0", "#4FC2E7", "#3CB2D9", 
                "#5C9DED", "#4C8CDC", "#9398EC", "#7277D5", "#CC93EF", 
                "#B377D9", "#ED87BF", "#D870AE"
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

checkBallInArc() {
    const ballAngle = this.getBallAngle();
    const tolerance = this.debugSettings.tapTolerance;
    
    // 处理跨360度的特殊情况
    const normalizedArcStart = this.arc[0];
    const normalizedArcEnd = this.arc[1] > 360 ? this.arc[1] - 360 : this.arc[1];
    
    // 调整角度计算逻辑
    const isInArc = 
        (ballAngle >= normalizedArcStart - tolerance && 
         ballAngle <= normalizedArcEnd + tolerance) ||
        (this.arc[1] > 360 && 
         (ballAngle + 360 >= normalizedArcStart - tolerance && 
          ballAngle + 360 <= normalizedArcEnd + tolerance));
    
    console.log('Ball Angle:', ballAngle, 'Arc Range:', this.arc, 'Is In Arc:', isInArc);
    
    return isInArc;
},

        tap(e) {
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }

            if (e && (e.target.tagName === 'INPUT' || e.target.closest('#debug-panel'))) {
                return false;
            }

            if (this.debugMode) {
                if (this.score >= this.debugSettings.maxScore) {
                    this.stopPlay();
                    return false;
                }
                if (this.score <= this.debugSettings.minScore) {
                    this.stopPlay();
                    return false;
                }
            }

            switch (this.state) {
                case "init":
                case "stopped":
                    this.startPlay();
                    break;
                case "started":
                    if (this.checkBallInArc()) {
                        const currentTapTime = Date.now();
                        const tapInterval = currentTapTime - this.prevTapTime;
                        this.taps++;
                        this.score = this.score + (tapInterval < 500 ? 5 : tapInterval < 1000 ? 2 : 1);
                        this.prevTapTime = currentTapTime;
                        this.setArc();
                    } else {
                        this.stopPlay();
                    }
                    break;
            }
        },

        enableDebugMode(settings = {}) {
            this.debugMode = true;
            this.debugSettings = { 
                ...this.debugSettings, 
                ...Object.fromEntries(
                    Object.entries(settings).filter(([_, value]) => value !== undefined && value !== null)
                )
            };

            console.log('Debug Settings Updated:', this.debugSettings);

            const ball = document.getElementById('ball');
            if (ball) {
                ball.setAttribute('r', this.debugSettings.ballSize);
                console.log('Ball Size Set:', this.debugSettings.ballSize);
            }

            const looptapElement = document.getElementById('looptap');
            if (looptapElement) {
                if (this.debugSettings.enable3DMode) {
                    looptapElement.style.transform = 'perspective(500px) rotateX(45deg)';
                    console.log('3D Mode Enabled');
                } else {
                    looptapElement.style.transform = 'none';
                    console.log('3D Mode Disabled');
                }
            }

            if (ball) {
                ball.style.animationDuration = `${this.debugSettings.rotationSpeed}ms`;
                console.log('Rotation Speed Set:', this.debugSettings.rotationSpeed);
            }

            const debugStateEl = document.getElementById('debug-state');
            const debugScoreEl = document.getElementById('debug-score');
            const debugTapsEl = document.getElementById('debug-taps');
            const debugColorEl = document.getElementById('debug-color');

            if (debugStateEl) debugStateEl.textContent = this.state;
            if (debugScoreEl) debugScoreEl.textContent = this.score;
            if (debugTapsEl) debugTapsEl.textContent = this.taps;
            if (debugColorEl) {
                debugColorEl.textContent = this.colors[Math.floor(this.score / 10)] || '未知';
            }

            if (settings.maxScore !== undefined) {
                this.debugSettings.maxScore = Number(settings.maxScore);
                console.log('Max Score Set:', this.debugSettings.maxScore);
            }

            if (settings.minScore !== undefined) {
                this.debugSettings.minScore = Number(settings.minScore);
                console.log('Min Score Set:', this.debugSettings.minScore);
            }
        }
    },
}).mount("#canvas");

if ("ontouchstart" in window) {
    window.addEventListener("touchstart", (e) => {
        if (!e.target.closest('#debug-panel')) {
            loopTapApp.tap(e);
        }
    }, { passive: false });
} else {
    window.addEventListener("mousedown", (e) => {
        if (!e.target.closest('#debug-panel')) {
            loopTapApp.tap(e);
        }
    }, { passive: false });
}

window.onkeydown = (e) => {
    if (e.target.tagName !== 'INPUT' && e.code === 'Space') {
        e.preventDefault();
        const ballAngle = loopTapApp.getBallAngle();
        const currentArc = loopTapApp.arc;
        
        if (loopTapApp.state === 'started') {
            if (loopTapApp.checkBallInArc()) {
                loopTapApp.tap(e);
            } else {
                loopTapApp.stopPlay();
            }
        } else {
            loopTapApp.tap(e);
        }
    }
};

window.loopTapApp = loopTapApp;

if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js");
}
