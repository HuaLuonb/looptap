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
            debugPassword: '54188',
            debugSettings: {
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
                if (this.score > this.best) window.localStorage.best = this.best = this.score;
            }
        },

        tap(e) {
            e.preventDefault();
            e.stopPropagation();
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

        // 新增 Debug 模式切换方法
        toggleDebugMode() {
            const password = prompt('请输入 Debug 模式密码:');
            if (password === this.debugPassword) {
                this.debugMode = !this.debugMode;
                alert(this.debugMode ? 'Debug 模式已开启' : 'Debug 模式已关闭');
            } else {
                alert('密码错误');
            }
        },

        // 更新 Debug 设置
        updateDebugSettings(setting, value) {
            if (this.debugMode) {
                this.debugSettings[setting] = Number(value);
            }
        },

        // 切换 3D 模式
        toggleThreeDMode() {
            this.threeDMode = !this.threeDMode;
            this.applyThreeDMode();
        },

        // 应用 3D 模式效果
        applyThreeDMode() {
            const looptap = document.getElementById('looptap');
            if (this.threeDMode) {
                looptap.style.transform = 'perspective(500px) rotateX(20deg) rotateY(20deg)';
                looptap.style.transition = 'transform 0.5s';
            } else {
                looptap.style.transform = 'none';
            }
        },

        // 自动播放功能（仅在 Debug 模式）
        autoPlay() {
            if (this.debugMode && this.debugSettings.autoPlay) {
                const ballAngle = this.getBallAngle();
                if (ballAngle + 6 > this.arc[0] && ballAngle - 6 < this.arc[1]) {
                    this.tap({ preventDefault: () => {}, stopPropagation: () => {} });
                }
            }
        }
    },
    mounted() {
        // 添加 Debug 模式切换监听器
        document.addEventListener('keydown', (e) => {
            if (e.altKey && e.key === 'D') {
                this.toggleDebugMode();
            }
        });

        // 如果启用了自动播放，则定期触发
        setInterval(() => {
            this.autoPlay();
        }, 500);
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
