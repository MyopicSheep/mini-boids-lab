/*!
 * Twirling
 * @author: Daphne Cheung
 * @version: 2.1.5
 * @description: Animated umbrella tops inspired by Craig Reynolds' Boids,
 * the Flocking example by Daniel Shiffman and Tadpoles by Paper.js
 * @see: http://www.red3d.com/cwr/boids/
 * @see: http://processing.org/learning/topics/flocking.html
 * @see: http://paperjs.org/examples/tadpoles/
 */


/**
 * requestAnimationFrame polyfill by Erik Möller. Fixes from Paul Irish and Tino Zijdel
 * @see: http://paulirish.com/2011/requestanimationframe-for-smart-animating/
 * @see: http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
 * @license: MIT license
 */


(function () {
    "use strict";
    
    var lastTime = 0,
        x,
        currTime,
        timeToCall,
        id,
        vendors = ['ms', 'moz', 'webkit', 'o'];
    for (x = 0; x < vendors.length && !window.requestAnimationFrame; x += 1) {
        window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame']
                                   || window[vendors[x] + 'CancelRequestAnimationFrame'];
    }
 
    if (!window.requestAnimationFrame) {
        window.requestAnimationFrame = function (callback, element) {
            currTime = new Date().getTime();
            timeToCall = Math.max(0, 16 - (currTime - lastTime));
            id = window.setTimeout(function () { callback(currTime + timeToCall); },
                timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
    }
    
    if (!window.cancelAnimationFrame) {
        window.cancelAnimationFrame = function (id) {
            clearTimeout(id);
        };
    }
}());


function twirlingGo() {
    "use strict";
    
    var canvasSupport = !!document.createElement('canvas').getContext,
        canvas,
        posX = 0,
        posY = 0,
        numBoids = 7,
        jar = [],
        pauseIt = true,
        ctx,
        myCanvas = document.getElementById('twirling');
    
    
    function styleCanvas(canvas, element) {
        canvas.style.backgroundColor = "#000";
        canvas.width = element.offsetWidth;
        canvas.height = element.offsetHeight;
    }
    
    function morfX(cx, r, angle) {
        return (cx + r * Math.cos(angle));
    }
    
    function morfY(cy, r, angle) {
        return (cy + r * Math.sin(angle));
    }

    
    function prepSide(i, cx, cy, r, numSides) {
        var segments = 2 * Math.PI / numSides,
            sangle = segments * i,
            eangle = segments * (i + 1),
            // Each segment has 3 identifiable points
            // to control
            x0 = morfX(cx, r, sangle),
            y0 = morfY(cy, r, sangle),
            x1 = morfX(cx, r - 5, (sangle + eangle) / 2),
            y1 = morfY(cy, r - 5, (sangle + eangle) / 2),
            x2 = morfX(cx, r, eangle),
            y2 = morfY(cy, r, eangle);
            
        return {
            sangle: sangle,
            eangle: eangle,
            x0: x0,
            y0: y0,
            x1: x1,
            y1: y1,
            x2: x2,
            y2: y2
        };
    }
    
    function Boid() {
        var i,
            r = Math.floor(Math.random() * 255),
            g = Math.floor(Math.random() * 255),
            b = Math.floor(Math.random() * 255);
        this.numSides = 9;
        this.x = canvas.width / 2;
        this.y = canvas.height / 2;
        this.r = 80;
        this.angle = Math.random() * Math.PI * 2;
        this.velocityX = Math.random() * 2 - 1;
        this.velocityY = Math.random() * 2 - 1;
        this.radius = 90;
        this.accelerationX = 0;
        this.accelerationY = 0;
        this.maxsteer = 0.05 + Math.random() * 0.5;
        this.maxspeed = 1.5 + Math.random() * 0.5;
        this.fillColor = "rgba(" + r + ", " + g + ", " + b + ", 0.5)";
    }
    

     
    Boid.prototype.bounce = function (boids) {
        var steerX = 0,
            steerY = 0,
            vectX = 0,
            vectY = 0,
            count = 0,
            dist,
            mdist,
            otherb,
            i;
        
        for (i = 0; i < boids.length; i += 1) {
            otherb = boids[i];
            vectX = this.x - otherb.x;
            vectY = this.y - otherb.y;
            dist = Math.sqrt(Math.pow(vectX, 2) + Math.pow(vectY, 2));
            if (dist > 0 && dist < this.r) {
                steerX += vectX / dist;
                steerY += vectY / dist;
                count += 1;
            }
        }
        
        if (count > 0) {
            steerX = steerX / count;
            steerY = steerY / count;
        }
        
        if (!(steerX === 0 && steerY === 0)) {
            // Reynolds: Steering = Desired - Velocity
            steerX = (steerX * this.maxspeed) - this.velocityX;
            steerY = (steerY * this.maxspeed) - this.velocityY;
            mdist = Math.min(Math.sqrt(Math.pow(steerX, 2) + Math.pow(steerY, 2)),
                             this.maxsteer);
            steerX = steerX * mdist;
            steerY = steerY * mdist;
            
        }
        
        return [steerX, steerY];
    };


    
    Boid.prototype.flock = function (boids) {
        var bounce = this.bounce(boids);
        this.accelerationX += bounce[0];
        this.accelerationY += bounce[1];
    };

    Boid.prototype.update = function () {
        this.velocityX += this.accelerationX;
        this.velocityY += this.accelerationY;
        this.angle += Math.min(this.velocityX / 20, this.maxspeed);
        this.x += Math.min(this.velocityX, this.maxspeed);
        this.y += Math.min(this.velocityY, this.maxspeed);
        this.accelerationX = 0;
        this.accelerationY = 0;
    };

    
    Boid.prototype.borders = function () {
        if (this.x < -this.radius) {
            this.x = canvas.width + this.radius;
        }
        if (this.y < -this.radius) {
            this.y = canvas.height + this.radius;
        }
        if (this.x > canvas.width + this.radius) {
            this.x = -this.radius;
        }
        if (this.y > canvas.height + this.radius) {
            this.y = -this.radius;
        }
    };
    
    
    Boid.prototype.run = function (boids) {
        this.flock(boids);
        this.borders();
        this.update();
        this.render();
    };


    Boid.prototype.render = function () {
        var i, side;
        ctx.save();
        
        ctx.beginPath();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        for (i = 0; i < this.numSides; i += 1) {
            // Everything is now relative to origin (0, 0)
            side = prepSide(i, 0, 0, this.r, this.numSides);
            ctx.moveTo(side.x0, side.y0);
            ctx.quadraticCurveTo(side.x1, side.y1, side.x2, side.y2);
            ctx.lineTo(0, 0);
        }
        ctx.fillStyle = this.fillColor;
        ctx.fill();
        ctx.lineWidth = 0.5;
        ctx.strokeStyle = this.fillColor;
        ctx.shadowColor = "rgba(255, 255, 255, 0.3)";
        ctx.shadowBlur = 2;
        ctx.rotate(this.angle * -1);
        ctx.translate(-this.x, -this.y);
        ctx.stroke();
        ctx.restore();
    };

    
    
    function drawBoids() {
        var i, j;
        
        if (!canvasSupport) { return; }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        for (j = 0; j < jar.length; j += 1) {
            jar[j].run(jar);
        }
        
        if (!pauseIt) {
            document.getElementById('twirling').firstChild.style.opacity = 1; // To fade in on page load
            window.requestAnimationFrame(drawBoids);
        }
    }
    
    // Courtesy of http://stackoverflow.com/questions/123999/how-to-tell-if-a-dom-element-is-visible-in-the-current-viewport
    function isElementInViewport(el) {
        var rect = el.getBoundingClientRect();
        return rect.bottom > 0 &&
            rect.right > 0 &&
            rect.left < (window.innerWidth || document.documentElement.clientWidth) &&
            rect.top < (window.innerHeight || document.documentElement.clientHeight);
    }
    
    
    function checkView() {
        var page = document.getElementById('twirling').firstChild;
        if (isElementInViewport(page) && pauseIt === true) {
            pauseIt = false;
            drawBoids();
        } else if (isElementInViewport(page)) {
            pauseIt = false;
        } else {
            pauseIt = true;
        }
    }
    
    
    /* draw
     */
    function draw() {

        // Event listeners
        
        window.addEventListener('scroll', function () {
            clearTimeout(window.scrollFin);
            window.scrollFin = setTimeout(checkView(), 300);
        }, false);

        
        window.addEventListener('blur', function () {
            pauseIt = true;
        }, false);

        window.addEventListener('focus', function () {
            var page = document.getElementById('twirling').firstChild;
            if (pauseIt) {
                pauseIt = false;
                // Check if animation is still visible when window refocused.
                if (!isElementInViewport(page)) {
                    pauseIt = true;
                }
                drawBoids();
            }
        }, false);

        window.addEventListener('resize', function () {
            setTimeout(function () {
                var newCanvas = document.getElementById('twirling');
                styleCanvas(canvas, newCanvas);
            }, 300);
        }, false);
        
    }
    
    /* Init
     */
    function init() {
        var i, page;
        // Set up canvas if supported by the browser
        if (!canvasSupport) { return; }
        
        canvas = document.createElement('canvas');
        myCanvas.insertBefore(canvas, myCanvas.firstChild);
        styleCanvas(canvas, myCanvas);
        ctx = canvas.getContext('2d');
        page = document.getElementById('twirling').firstChild;
        
        // Add the boids
        for (i = 0; i < numBoids; i += 1) {
            jar.push(new Boid());
        }
        
        // Play animation at page load if it's already in viewport.
        if (isElementInViewport(page)) {
            pauseIt = false;
        }
        
        if (!pauseIt) {
            drawBoids();
        }
    }
    
    init();
    draw();
    
}


window.addEventListener('load', function () {
    "use strict";
    if (document.getElementById('twirling')) {
        clearTimeout(document.animStart);
        document.animStart = setTimeout(twirlingGo, 100);
    }
});






