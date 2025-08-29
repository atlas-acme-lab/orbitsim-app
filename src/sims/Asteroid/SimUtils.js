import { findMarkers, findObjects, flattenFrame, renderObjectOnBg } from "../../utils/CVUtils";

const REQD_MARKERS = [
    10, // Top left 
    11, // Top right
    12, // Bottom right
    13, // Bottom left
    103, // Sun
    100, // Focus
    101  // Asteroid
]

export const AsteroidSimulation = class {
    constructor() {
        this.width = 1080;
        this.height = 720;

        this.pageState = "";
        this.currentCapture = null;

        this.background = null;
        this.sun = null;
        this.asteroid = null;
        this.focus = null;

        this.sunPos = { x: 0, y: 0};
        this.asteroidPos = { x: 0, y: 0};
        this.focusPos = { x: 0, y: 0};

        this.ellipseInfo = {width: 0, height: 0, angle: 0, isSet: false};
        this.ellipsePos = {x: 0, y: 0};
        this.asteroidInfo = {v: 0, peri: {x: 0, y: 0}, theta: 0};

        this.objectImg = null;

        this.simulationReady = false;
    }

    updateState(newState) {
        this.pageState = newState;    
    }

    getState() {
        return this.pageState;
    }

    updateCurrentCapture(capture) {
        if (this.currentCapture !== null)
            capture.copyTo(this.currentCapture);
        else 
            this.currentCapture = capture.clone();
        // console.log("Updated current capture");
    }

    getCurrentCapture() {
        return this.currentCapture;
    }

    checkBgMarkers(img, markers) {
        findMarkers(img, markers);
    
        let found = true;
        
        let i;
        for (i = 0; i < 4; i++) {
            if (!markers.has(REQD_MARKERS[i]))
                found = false;
        }
    
        if (found) this.updateCurrentCapture(img);
        return found;
    }

    checkObjMarkers(img, markers) {
        findMarkers(img, markers);
    
        let found = true;
        
        let i;
        for (i = 0; i < 7; i++) {
            if (!markers.has(REQD_MARKERS[i]))
                found = false;
        }
    
        if (found) this.updateCurrentCapture(img);
        return found;
    }

    addBackground() {
        let markers = new Map();
        findMarkers(this.currentCapture, markers);
        
        this.background = new cv.Mat();
        let _ = flattenFrame(this.currentCapture, this.background, markers, this.width, this.height);
    
        console.log("[INFO] Added background");
    }

    previewBackground(canvas, width, height) {
        if (this.background !== null) {
            let temp = new cv.Mat();
            let dsize = new cv.Size(width, height);

            cv.resize(this.background, temp, dsize, 0, 0, cv.INTER_AREA);
            cv.imshow(canvas, temp);

            temp.delete();

            console.log("[DEBUG] Rendered background");
        }
    }

    addObjects() {
        let markers = new Map();
        findMarkers(this.currentCapture, markers);

        // Flatten image with an offset
        let capture = new cv.Mat();
        let M = flattenFrame(this.currentCapture, capture, markers, this.width, this.height);

        // Find objects in the flattened image
        let objects = new Map();
        this.objectImg = this.background.clone();
        // this.objectImg = capture.clone();
        findObjects(capture, markers, M, objects);

        // Add sun 
        if (objects.has(103)) {
            this.sun = objects.get(103).img;
            this.sunPos = objects.get(103).center;

            renderObjectOnBg(this.objectImg, this.sun, this.sunPos);
            console.log(`[INFO] Added sun at ${this.sunPos.x}, ${this.sunPos.y}`);
        }

        // Add asteroid 
        if (objects.has(101)) {
            this.asteroid = objects.get(101).img;
            this.asteroidPos = objects.get(101).center;

            renderObjectOnBg(this.objectImg, this.asteroid, this.asteroidPos);
            console.log(`[INFO] Added asteroid at ${this.asteroidPos.x}, ${this.asteroidPos.y}`);
        }

        // Add focus 
        if (objects.has(100)) {
            this.focus = objects.get(100).img;
            this.focusPos = objects.get(100).center;

            renderObjectOnBg(this.objectImg, this.focus, this.focusPos);
            console.log(`[INFO] Added focus at ${this.focusPos.x}, ${this.focusPos.y}`);
        }

        this.simulationReady = objects.has(100) && objects.has(101) && objects.has(103);
        capture.delete();

        this.ellipseInfo.isSet = false;
    }

    previewObjects(canvas, width, height) {
        if (this.objectImg !== null) {
            console.log("[DEBUG] Rendering objects");

            let temp = new cv.Mat();
            let dsize = new cv.Size(width, height);

            cv.resize(this.objectImg, temp, dsize, 0, 0, cv.INTER_AREA);
            cv.imshow(canvas, temp);

            temp.delete();

            console.log("[DEBUG] Rendered objects");
        }
    }

    animateOrbit(canvas, frameCount, width, height, checked) {
        // Dummy animation -- need to fix
        if (this.simulationReady) {
            // let frame = this.background.clone();

            // // Place the sun at the center
            // renderObjectOnBg(frame, this.sun, {x: Math.floor(this.width / 2), y: Math.floor(this.height / 2)});

            // // Calculate the asteroid's position in the orbit 
            // let angularSpeed = 0.08;
            // let theta = frameCount * angularSpeed;
            // let radius = Math.floor(this.height / 3);
            // this.asteroidPos.x = Math.floor(this.width / 2) + radius * Math.cos(theta);
            // this.asteroidPos.y = Math.floor(this.height / 2) + radius * Math.sin(theta);
            
            // renderObjectOnBg(frame, this.asteroid, this.asteroidPos);

            // // Resize frame to fit on canvas 
            // let temp = new cv.Mat();
            // let dsize = new cv.Size(width, height);

            // cv.resize(frame, temp, dsize, 0, 0, cv.INTER_AREA);
            // cv.imshow(canvas, temp);

            // temp.delete();
            // frame.delete();

            const ctx = canvas.getContext("2d");
            let frame = this.background.clone();

            // only calculate the ellipse if it hasn't been calculated before
            if(this.ellipseInfo.isSet == false) {
                this.calculateEllipse();
            }
            this.calculateVelocity();

            // Increment the angle (true anomaly) to simulate orbital motion
            this.asteroidInfo.theta += this.asteroidInfo.v;

            // Calculate the new position of the asteroid based on the angle
            let rotEllipseX = this.ellipsePos.x * Math.cos(this.ellipseInfo.angle) + this.ellipsePos.y * Math.sin(this.ellipseInfo.angle);
            let rotEllipseY = -this.ellipsePos.x * Math.sin(this.ellipseInfo.angle) + this.ellipsePos.y * Math.cos(this.ellipseInfo.angle);

            let rotAsteroidX = rotEllipseX + (this.ellipseInfo.width/2) * Math.cos(this.asteroidInfo.theta);
            let rotAsteroidY = rotEllipseY + (this.ellipseInfo.height/2) * Math.sin(this.asteroidInfo.theta);

            this.asteroidPos.x = rotAsteroidX * Math.cos(this.ellipseInfo.angle) - rotAsteroidY * Math.sin(this.ellipseInfo.angle);
            this.asteroidPos.y = rotAsteroidX * Math.sin(this.ellipseInfo.angle) + rotAsteroidY * Math.cos(this.ellipseInfo.angle);

            // Place all the image objects
            renderObjectOnBg(frame, this.sun, this.sunPos);
            renderObjectOnBg(frame, this.focus, this.focusPos);
            renderObjectOnBg(frame, this.asteroid, this.asteroidPos);

            // Resize frame to fit on canvas 
            let temp = new cv.Mat();
            let dsize = new cv.Size(width, height);

            cv.resize(frame, temp, dsize, 0, 0, cv.INTER_AREA);
            cv.imshow(canvas, temp);

            // Draw the ellipse
            if(checked){
                ctx.beginPath();
                ctx.strokeStyle = "yellow";
                ctx.lineWidth = 4;
                ctx.ellipse(this.ellipsePos.x, this.ellipsePos.y, this.ellipseInfo.width/2, this.ellipseInfo.height/2, this.ellipseInfo.angle, 0, 2 * Math.PI);
                ctx.stroke();
            }
            
            temp.delete();
            frame.delete();
        }
    }

    calculateEllipse(){
        // differences between x and y's of the sun and second focus point
        let fociDiff = {x: this.sunPos.x - this.focusPos.x, y: this.sunPos.y - this.focusPos.y};

        // angle between sun and second focus point
        this.ellipseInfo.angle = Math.atan2(fociDiff.y, fociDiff.x);

        // coordinates of center of ellipse
        this.ellipsePos.x = fociDiff.x/2 + this.focusPos.x;
        this.ellipsePos.y = fociDiff.y/2 + this.focusPos.y;
        
        // c = half distance between the two foci
        let c = (Math.sqrt(Math.pow(fociDiff.x, 2) + Math.pow(fociDiff.y, 2)))/2;

        // d1 and d2 = distances between asteroid and the two focus points
        let d1 = Math.sqrt(Math.pow(this.asteroidPos.x - this.focusPos.x, 2) + Math.pow(this.asteroidPos.y - this.focusPos.y, 2));
        let d2 = Math.sqrt(Math.pow(this.asteroidPos.x - this.sunPos.x, 2) + Math.pow(this.asteroidPos.y - this.sunPos.y, 2));

        // calculate width and height
        this.ellipseInfo.width = d1 + d2;
        this.ellipseInfo.height = 2 * Math.sqrt(Math.abs(Math.pow(this.ellipseInfo.width/2, 2) - Math.pow(c, 2)));

        // calculate coordinate of periapsis (closest point to the sun)
        this.asteroidInfo.peri.x = this.ellipsePos.x - ((this.ellipseInfo.width/2) * Math.cos(this.ellipseInfo.angle));
        this.asteroidInfo.peri.y = this.ellipsePos.y - ((this.ellipseInfo.height/2) * Math.sin(this.ellipseInfo.angle));

        // calculate true anamoly (angle between the asteroid and the periapsis)
        this.asteroidInfo.theta = Math.atan2((this.asteroidPos.y - this.asteroidInfo.peri.y), (this.asteroidPos.x - this.asteroidInfo.peri.x));

        this.ellipseInfo.isSet = true;
    }

    calculateVelocity(){
        let a = this.ellipseInfo.width/2;
        // distance between the asteroid and the sun
        let r = Math.sqrt(Math.pow(this.asteroidPos.x - this.sunPos.x, 2) + Math.pow(this.asteroidPos.y - this.sunPos.y, 2));

        let G = 6.67430e-11;
        let M = 1.989e9;

        // calculate angular velocity using the vis viva equation
        this.asteroidInfo.v = Math.sqrt(G*M*((2/r)-(1/a)));
    }
}