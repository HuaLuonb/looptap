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
                tapTolerance: 30  // 新增容错角度
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
            
            // 考虑角度循环
            const isInArc = 
                (ballAngle + tolerance >= this.arc[0] && ballAngle - tolerance <= this.arc[1]) ||
                (this.arc[1] > 360 && ballAngle + tolerance >= (this.arc[0] - 360) && ballAngle - tolerance <= (this.arc[1] - 360));
            
            return isInArc;
        },

        tap(e) {
            // 阻止默认事件
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }

            // 如果是输入框，不触发游戏逻辑
            if (e && (e.target.tagName === 'INPUT' || e.target.closest('#debug-panel'))) {
                return false;
            }

            // 调试模式下的特殊处理
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

            // 游戏状态处理
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
            this.debugSettings = { ...this.debugSettings, ...settings };

            // 应用调试设置
            const ball = document.getElementById('ball');
            if (ball) {
                ball.setAttribute('r', this.debugSettings.ballSize);
            }

            // 3D模式处理
            if (this.debugSettings.enable3DMode) {
                document.getElementById('looptap').style.transform = 'perspective(500px) rotateX(45deg)';
            } else {
                document.getElementById('looptap').style.transform = 'none';
            }

            // 更新旋转速度
            const ballElement = document.getElementById('ball');
            if (ballElement) {
                ballElement.style.animationDuration = `${this.debugSettings.rotationSpeed}ms`;
            }

            // 更新调试面板信息
            document.getElementById('debug-state').textContent = this.state;
            document.getElementById('debug-score').textContent = this.score;
            document.getElementById('debug-taps').textContent = this.taps;
            document.getElementById('debug-color').textContent = 
                this.colors[Math.floor(this.score / 10)] || '未知';
        }
    },
}).mount("#canvas");

// 事件监听器调整
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
    // 避免在输入框时触发
    if (e.target.tagName !== 'INPUT' && e.code === 'Space') {
        e.preventDefault(); // 阻止空格默认行为
        
        // 检查球是否在得分区
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

// 将loopTapApp挂载到window对象
window.loopTapApp = loopTapApp;

if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js");
}
