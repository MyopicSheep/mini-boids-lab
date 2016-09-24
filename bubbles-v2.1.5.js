/*
 * Bubbles
 * @author: Daphne Cheung
 * @version: 2.1.5
 * @description: Animated bubbles inspired by Craig Reynolds' Boids,
 * the Flocking example by Daniel Shiffman and Tadpoles by Paper.js
 * @see: http://www.red3d.com/cwr/boids/
 * @see: http://processing.org/learning/topics/flocking.html
 * @see: http://paperjs.org/examples/tadpoles/
 */


/**
 * requestAnimationFrame polyfill by Erik Möller. Fixes from Paul Irish 
 * and Tino Zijdel
 * @see: http://paulirish.com/2011/requestanimationframe-for-smart-animating/
 * @see: http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-
 * for-smart-er-animating
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

// This function handles all of the set up, behaviours, and 
// drawing of the bubbles.
function bubblesGo() {
    "use strict";
    
    var canvasSupport = !!document.createElement('canvas').getContext,
        canvas,
        posX = 0,
        posY = 0,
        numBoids = 50,
        jar = [],
        pauseIt = true,
        ctx,
        myCanvas = document.getElementById('bubbles');
    
    function styleCanvas(canvas, element) {
        canvas.style.backgroundColor = "#7f7386";
        canvas.width = element.offsetWidth;
        canvas.height = element.offsetHeight;
    }
    
    // Set up the boid's appearance, initial position, and behaviour
    function Boid() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.velocityX = Math.random() * 2 - 1;
        this.velocityY = Math.random() * 2 - 1;
        this.radius = 30;
        this.accelerationX = 0;
        this.accelerationY = 0;
        this.maxsteer = 0.05 + Math.random() * 0.5;
        this.maxspeed = 1.5 + Math.random() * 0.5;
    }
    
    // The boid's separating tendency given its position relative to the others
    Boid.prototype.separate = function (boids) {
        var desiredseparation = 20,
            steerX = 0,
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
            if (dist > 0 && dist < desiredseparation) {
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

    // The boid's aligning tendency given its position relative to the others
    Boid.prototype.align = function (boids) {
        var neighbourdist = 5,
            steerX = 0,
            steerY = 0,
            vectX = 0,
            vectY = 0,
            count = 0,
            otherb,
            mdist,
            dist,
            i;
        for (i = 0; i < boids.length; i += 1) {
            otherb = boids[i];
            vectX = this.x - otherb.x;
            vectY = this.y - otherb.y;
            dist = Math.sqrt(Math.pow(vectX, 2) + Math.pow(vectY, 2));
            if (dist > 0 && dist < neighbourdist) {
                steerX += otherb.velocityX;
                steerY += otherb.velocityY;
                count += 1;
            }
        }
        if (count > 0) {
            steerX = steerX / count;
            steerY = steerY / count;
        }
        if (!(steerX === 0 && steerY === 0)) {
            // Reynolds: Steering = Desired - Velocity
            steerX = this.maxspeed - this.velocityX;
            steerY = this.maxspeed - this.velocityY;
            mdist = Math.min(Math.sqrt(Math.pow(steerX, 2) + Math.pow(steerY, 2)),
                             this.maxsteer);
            steerX = steerX * mdist;
            steerY = steerY * mdist;
        }
        return [steerX, steerY];
    };

    // Define the boid's seeking behaviour, which is a reaction to the boid's
    // cohesive tendencies.
    Boid.prototype.seek = function (targetX, targetY, slowdown) {
        var steerX = 0,
            steerY = 0,
            mdist,
            desiredX = targetX - this.x,
            desiredY = targetY - this.y,
            dist = Math.sqrt(Math.pow(desiredX, 2) + Math.pow(desiredY, 2));
        if (slowdown && dist < 100) {
            mdist = this.maxspeed * (dist / 100);
        } else {
            mdist = this.maxspeed;
        }
        
        desiredX = desiredX * mdist;
        desiredY = desiredY * mdist;
        steerX = desiredX - this.velocityX;
        steerY = desiredY - this.velocityY;
        mdist = Math.min(Math.sqrt(Math.pow(steerX, 2) + Math.pow(steerY, 2)),
                         this.maxsteer);
        steerX = steerX * mdist / 100;
        steerY = steerY * mdist / 100;
        return [steerX, steerY];
    };

    // The boid's cohesive tendency given its position relative to the others
    Boid.prototype.cohesion = function (boids) {
        var neighbourdist = 150,
            sumX = 0,
            sumY = 0,
            vectX = 0,
            vectY = 0,
            otherb,
            dist,
            count = 0,
            i;
        for (i = 0; i < boids.length; i += 1) {
            otherb = boids[i];
            vectX = this.x - otherb.x;
            vectY = this.y - otherb.y;
            dist = Math.sqrt(Math.pow(vectX, 2) + Math.pow(vectY, 2));
            if (dist > 0 && dist < neighbourdist) {
                sumX += otherb.x;
                sumY += otherb.y;
                count += 1;
            }
        }
        
        if (count > 0) {
            sumX = sumX / count;
            sumY = sumY / count;
            return this.seek(sumX, sumY, false);
        }
        return [sumX, sumY];
    };
    

    // Calculate each factor of a boid's behaviour relative to its flock
    // and sum up the factors to obtain an incremental value in the form of a x-
    // directional movement (horz) and y-directional movement (vert). 
    Boid.prototype.flock = function (boids) {
        var sep = this.separate(boids),
            ali = this.align(boids),
            coh = this.cohesion(boids);
        this.accelerationX += sep[0] + ali[0] + coh[0];
        this.accelerationY += sep[1] + ali[1] + coh[1];
    };

    // Add the calculated incremental value to the boid's current state to
    // define its next position.
    Boid.prototype.update = function () {
        this.velocityX += this.accelerationX;
        this.velocityY += this.accelerationY;
        this.x += Math.min(this.velocityX, this.maxspeed);
        this.y += Math.min(this.velocityY, this.maxspeed);
        // Reset acceleration for next position
        this.accelerationX = 0;
        this.accelerationY = 0;
        
    };

    // Define how the boids behave near the edges of the browser
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

    // Draw the boid in the canvas
    Boid.prototype.render = function () {
        ctx.beginPath();
        ctx.arc(this.x, this.y, 10, 0, 2 * Math.PI, true);
        ctx.lineWidth = 0.3;
        ctx.strokeStyle = "rgba(255, 255, 255, 1)";
        ctx.shadowColor = "rgba(255, 255, 255, 0.8)";
        ctx.shadowBlur = 10;
        ctx.fillStyle = "rgba(127, 115, 134, 0.5)";
        ctx.fill();
        ctx.stroke();
    };
        
    // The run method sets the sequence of events for a boid to
    // go through with every change in the flock before rendering. 
    Boid.prototype.run = function (boids) {
        this.flock(boids);
        this.borders();
        this.update();
        this.render();
    };
    
    // Clear the canvas, run through each boid, establishing their next
    // positions relative to the flock before drawing.
    function drawBoids() {
        var j;
        
        if (!canvasSupport) { return; }
        // Clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        for (j = 0; j < jar.length; j += 1) {
            jar[j].run(jar);
        }
        
        if (!pauseIt) {
            // Fade animation in on page load
            document.getElementById('bubbles').firstChild.style.opacity = 1; 
            window.requestAnimationFrame(drawBoids);
        }
    }
    
    // Animations can be resource hogs so the next two functions help us pause 
    // the animation whenever the canvas is not visible

    // Courtesy of http://stackoverflow.com/questions/123999/how-to-tell-if-a-
    // dom-element-is-visible-in-the-current-viewport
    function isElementInViewport(el) {
        var rect = el.getBoundingClientRect();
        return rect.bottom > 0 &&
            rect.right > 0 &&
            rect.left < (window.innerWidth || document.documentElement.clientWidth) &&
            rect.top < (window.innerHeight || document.documentElement.clientHeight);
    }

    function checkView() {
        // For efficiencies sake, we only want to run the drawBoids function if 
        // the canvas is visible AND already paused.
        var page = document.getElementById('bubbles').firstChild;
        if (isElementInViewport(page) && pauseIt === true) {
            pauseIt = false;
            drawBoids();
        } else if (isElementInViewport(page)) {
            pauseIt = false;
        } else {
            pauseIt = true;
        }
    }
    
    // Monitors opportunities to pause or draw animation.
    function draw() {
        // To avoid continuously checking if canvas still in view while  
        // scrolling, check 300 ms after scrolling has stopped.
        window.addEventListener('scroll', function () {
            clearTimeout(window.scrollFi);
            window.scrollFi = setTimeout(checkView, 300);
        }, false);

        window.addEventListener('blur', function () {
            pauseIt = true;
        }, false);

        window.addEventListener('focus', function () {
            checkView();
        }, false);

        // Don't forget to redraw the canvas size when the browser is re-sized
        window.addEventListener('resize', function () {
            setTimeout(function () {
                var newCanvas = document.getElementById("bubbles");
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
        page = document.getElementById('bubbles').firstChild;
        
        // Set up the boids (bubbles) to draw
        for (i = 0; i < numBoids; i += 1) {
            jar.push(new Boid());
        }
        
        // Animation is paused by default.
        // Play animation immediately after page loads if the canvas can be 
        // seen in the viewport.
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


// Only run if the page contains an element tagged with bubbles id.
// Allow 100ms for any page transitions to occur before starting
// the animation.
window.addEventListener('load', function () {
    "use strict";
    if (document.getElementById('bubbles')) {
        clearTimeout(document.animationBegin);
        document.animationBegin = setTimeout(bubblesGo, 100);
    }
});







