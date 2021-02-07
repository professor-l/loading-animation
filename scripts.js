class Animator {

    COLORS = [];
    constructor(canvasId, dimensionX, dimensionY, padding, parametric) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext("2d");

        this.parametric = parametric;

        this.setDimensions(dimensionX, dimensionY);
        this.ctx.lineWidth = padding;
        this.ctx.lineCap = "round";

        this.anim = 0;

        this.running = false;
    }

    // RGB interpolation - only one component (R, G, or B) is changing
    // at any given time
    setColorFromT(t) {
        let rgb = [0, 0, 0];
        let tStep = (this.parametric.pMax - this.parametric.pMin) / 6;
        let m = this.parametric.pMin + tStep;
        let s = 0;

        while (t > m) {
            t -= tStep;
            ++s;
        }

        // Interpolation level of RGB variable component
        let n = 255 * t / tStep;
        let i;

        // Even: s / 2 + 1 goes UP, previous is ff
        // Odd: (s - 1) / 2 goes DOWN, next is ff
        if (s % 2) {
            i = (s - 1) / 2;
            rgb[(i + 2) % 3] = 255;
            rgb[i % 3] = Math.floor(n);
        }
        else {
            i = (s / 2) + 1;
            rgb[(i + 1) % 3] = 255;
            rgb[i % 3] = 255 - Math.floor(n);
        }

        let f = "#";
        rgb.forEach(n => {
            f += n.toString(16).padStart(2, "0");
        });

        this.setColor(f);
    }

    setColor(c) {
        this.ctx.fillStyle = c;
        this.ctx.strokeStyle = c;
    }
    setDimensions(dx, dy) {
        this.width = dx;
        this.height = dy;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }

    tx(x) {
        return x + (this.width / 2);
    }

    ty(y) {
        return (this.height / 2) - y;
    }

    draw = () => {
        // Wipe
        this.ctx.clearRect(0, 0, this.width, this.height);

        // Set color dynamically
        this.setColorFromT(this.parametric.parameter);

        // Go to worm head
        let initial = this.parametric.points[0];
        this.ctx.beginPath();
        this.ctx.moveTo(this.tx(initial[0]), this.ty(initial[1]));

        // Iterate points
        this.parametric.points.slice().forEach(p => {
            this.ctx.lineTo(this.tx(p[0]), this.ty(p[1]));
        });

        // Ah, canvas
        this.ctx.stroke();
        
        if (this.running)
            this.anim = window.requestAnimationFrame(this.draw);
    }

    start() {
        this.running = true;
        this.anim = window.requestAnimationFrame(this.draw)
    }

    stop() {
        this.running = false;
    }
    
}

class Parametric {
    // Constant steps for all intervals for t
    STEPS = 100;

    // X and Y are callbacks
    // Domain size's value is usually some fraction of (pMax - pMin)
    // For instance, for pMin = 0, pMax = 2*pi, domain size may be 1
    constructor(x, y, pMin, pMax, coefficientX = 1, coefficientY = 1, domainSize = 1) {
        this.fx = x;
        this.fy = y;

        // Dynamic domain with static size
        this.domainSize = domainSize;

        // Min/max values of the parameter
        this.pMin = pMin;
        this.pMax = pMax;

        // Parameter itself
        this.parameter = this.pMin;
        // Parameter step (calculation subject to change)
        this.step = domainSize / this.STEPS;

        // Optional parameter for animations
        this.cx = coefficientX;
        this.cy = coefficientY;

        // The currently stored values
        this.points = [];

        // Allowing setInterval to be cleared
        this.inverval = 0;

        this.populate();
    }

    // Interfacing (public) methods
    start() {
        this.interval = setInterval(this.calcStep, 10);
    }

    stop() {
        clearInterval(this.interval);
    }

    populate() {
        while (this.points.length < this.STEPS) {
            this.iteratePoint();
            this.parameter += this.step;
        }
    }

    // Anonymous arrow function so it can be a callback
    // Also, ensuring it's only EVER a setInterval callback allows it
    // to be synchronous, so I don't have to bother with that bullshit
    calcStep = () => {
        this.iteratePoint();
        this.points.shift();
        this.parameter = (
            (this.parameter + this.step) % (this.pMax - this.pMin)
        ) + this.pMin;
    }

    iteratePoint() {
        this.points.push([
            this.fx(this.parameter) * this.cx,
            this.fy(this.parameter) * this.cy
        ]);
    }

}

window.onload = () => {
    const padding = Math.max(window.innerWidth, window.innerHeight) / 20;

    const p = new Parametric(
        x => (Math.cos(3 * x)),
        y => (Math.sin(2 * y)),
        0,
        2 * Math.PI,
        (window.innerWidth - padding - 1) / 2,
        (window.innerHeight - padding - 1) / 2
    );

    const a = new Animator(
        "animate",
        window.innerWidth,
        window.innerHeight,
        padding,
        p
    );

    a.start();
    p.start();
}