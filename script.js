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
            debugMode: false,
            debugPanelOpen: false,
            passwordEntered: false,
            passwordInput: '',
            correctPassword: '54188',
            debugSettings: {
                maxScore: 1000,
                minScore: 0,
                ballSize: 4,
                rotationSpeed: 2000,
                enable3DMode: false,
                tapTolerance: 60,
                customTolerance: 0
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
        toggleDebugPanel() {
            if (!this.passwordEntered) {
                this.checkPassword();
            } else {
                this.debugPanelOpen = !this.debugPanelOpen;
            }
        },

        checkPassword() {
            if (this.passwordInput === this.correctPassword) {
                this.passwordEntered = true;
                this.debugPanelOpen = true;
                this.passwordInput = '';
            } else {
                alert('密码错误');
                this.passwordInput = '';
            }
        },

        normalizeAngle(angle) {
            return ((angle % 360) + 360) % 360;
        },

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
            const bgCenter = { 
                x: bg.left + bg.width / 2, 
                y: bg.top + bg.height / 2 
            };
            const ball = document.getElementById("ball").getBoundingClientRect();
            const ballCenter = { 
                x: ball.left + ball.width / 2, 
                y: ball.top + ball.height / 2 
            };
            return this.getAngle(bgCenter.x, bgCenter.y, ballCenter.x, ballCenter.y);
        },

        checkBallInArc() {
            const ballAngle = this.normalizeAngle(this.getBallAngle());
            const arcStart = this.normalizeAngle(this.arc[0]);
            const arcEnd = this.normalizeAngle(this.arc[1]);
            
            const tolerance = this.debugSettings.tapTolerance + this.debugSettings.customTolerance;

            if (arcStart > arcEnd) {
                return (
                    (ballAngle >= arcStart - tolerance && ballAngle <= 360) || 
                    (ballAngle >= 0 && ballAngle <= arcEnd + tolerance)
                );
            } else {
                return (ballAngle >= arcStart - tolerance && ballAngle <= arcEnd + tolerance);
            }
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
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }

            if (e && (e.target.tagName === 'INPUT' || e.target.closest('#debug-panel'))) {
                return false;
            }

            switch (this.state) {
                case "init":
                case "stopped":
                    this.startPlay();
                    break;
                case "started":
                    const isInArc = this.checkBallInArc();

                    if (isInArc) {
                        const currentTapTime = Date.now();
                        const tapInterval = currentTapTime - this.prevTapTime;
                        this.taps++;
                        this.score += (tapInterval < 500 ? 5 : tapInterval < 1000 ? 2 : 1);
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

            if (settings.maxScore !== undefined) {
                this.debugSettings.maxScore = Number(settings.maxScore);
            }

            if (settings.minScore !== undefined) {
                this.debugSettings.minScore = Number(settings.minScore);
            }

            const ball = document.getElementById('ball');
            if (ball) {
                ball.setAttribute('r', this.debugSettings.ballSize);
            }

            const looptapElement = document.getElementById('looptap');
            if (looptapElement) {
                if (this.debugSettings.enable3DMode) {
                    looptapElement.style.transform = 'perspective(500px) rotateX(45deg)';
                } else {
                    looptapElement.style.transform = 'none';
                }
            }

            if (ball) {
                ball.style.animationDuration = `${this.debugSettings.rotationSpeed}ms`;
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
        loopTapApp.tap(e);
    }
};

window.loopTapApp = loopTapApp;

if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js");
}
