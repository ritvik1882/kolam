import * as THREE from 'three';

export {init, animate}

// Parameters and Scene Setup
let scene, camera, renderer, particles;
let mouseX = 0, mouseY = 0;
const windowHalfX = window.innerWidth / 2;
const windowHalfY = window.innerHeight / 2;
let animationProgress = 0;
let particleEventDispatched = false; // Flag to ensure event is dispatched only once

const cameraMovementFactor = 0.003;
const rotationFactor = 0.0002;
let linesGroup;
let designLines = []; // Initialize as empty array
let isAnimationComplete = false;
let currentLineIndex = 0;
let drawnPointsCount = 0;
let linesEventDispatched = false; // Flag to ensure event is dispatched only once

const bgCanvas = document.querySelector('#bg-canvas');
const startupAnimationComplete = new CustomEvent('startupAnimationComplete');

// Design Generation Logic
function generateDesignPaths() {
    const paths = []; // An array to hold arrays of points (each is a line)
    const numPetals = 12; // Number of symmetrical petals
    const angleIncrement = (Math.PI * 2) / numPetals;

    // Outer Petals
    const pointsPerPetal = 180;
    const petalRadius = 400;
    for (let i = 0; i < numPetals; i++) {
        const petalPoints = [];
        const petalAngle = i * angleIncrement;
        for (let j = 0; j < pointsPerPetal; j++) {
            const t = (j / (pointsPerPetal - 1)) * Math.PI; // Go from 0 to PI

            // Using a rhodonea curve (rose curve) for a floral shape
            const k = 4;
            const r = petalRadius * Math.sin(k * t) * (Math.sin(t * 0.5));

            const localX = r * Math.cos(t);
            const localY = r * Math.sin(t);
            const z = Math.sin(t * 8) * 25;

            // Rotate the point to its petal position
            const x = localX * Math.cos(petalAngle) - localY * Math.sin(petalAngle);
            const y = localX * Math.sin(petalAngle) + localY * Math.cos(petalAngle);

            petalPoints.push(new THREE.Vector3(x, y, z));
        }
        paths.push(petalPoints);
    }

    // Inner Swirls
    const swirlPoints = [];
    const innerRadius = 120;
    const innerPoints = 600;
    for (let i = 0; i < innerPoints; i++) {
        const angle = (i / innerPoints) * Math.PI * 6; // More turns
        const r = innerRadius * (i / innerPoints);
        const x = r * Math.cos(angle);
        const y = r * Math.sin(angle);
        const z = Math.sin(angle * 5) * 20;
        swirlPoints.push(new THREE.Vector3(x, y, z));
    }
    paths.push(swirlPoints);

    return paths;
}

// Main Initialization Function
function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 3000);
    camera.position.z = 1000;

    renderer = new THREE.WebGLRenderer({
        canvas: document.getElementById('bg-canvas'),
        antialias: true,
        alpha: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);

    linesGroup = new THREE.Group();
    scene.add(linesGroup);

    const designPaths = generateDesignPaths();

    const material = new THREE.LineBasicMaterial({
        color: 0xFFD700,
        transparent: true,
        opacity: 0.9,
    });

    designPaths.forEach(pathPoints => {
        if (pathPoints.length > 1) {
            const geometry = new THREE.BufferGeometry().setFromPoints(pathPoints);
            const line = new THREE.Line(geometry, material);
            line.geometry.setDrawRange(0, 0); // Initially hide the line
            designLines.push(line);
            linesGroup.add(line);
        }
    });

    document.body.addEventListener('pointermove', onPointerMove);
    window.addEventListener('resize', onWindowResize);

    if (!bgCanvas) {
        console.error("linesAnimation.js: #bg-canvas element not found. Event dispatch will fail.");
    } else {
        console.log("linesAnimation.js: #bg-canvas element found:", bgCanvas);
    }
}

// Event Handlers
function onPointerMove(event) {
    mouseX = event.clientX - windowHalfX;
    mouseY = event.clientY - windowHalfY;
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Animation Loop
function animate() {
    requestAnimationFrame(animate);

    // Drawing the Design
    if (!isAnimationComplete && currentLineIndex < designLines.length) {
        const currentLine = designLines[currentLineIndex];
        const totalPoints = currentLine.geometry.attributes.position.count;

        // Speed up drawing by incrementing more than 1 point per frame
        drawnPointsCount = Math.min(drawnPointsCount + 10, totalPoints); // Reverted to 10
        currentLine.geometry.setDrawRange(0, drawnPointsCount);

        // If the current line is finished, move to the next one
        if (drawnPointsCount >= totalPoints) {
            drawnPointsCount = 0;
            currentLineIndex++;
        }
    }

    // Dispatch event when animation is ~80% complete
    if (!linesEventDispatched && designLines.length > 0 && currentLineIndex >= designLines.length * 0.8) {
        if (bgCanvas) {
            console.log(`linesAnimation.js: Attempting to dispatch startupAnimationComplete event.`);
            setTimeout(() => {
                bgCanvas.dispatchEvent(startupAnimationComplete);
                console.log("linesAnimation.js: startupAnimationComplete event dispatched.");
            }, 0); // Dispatch immediately
            linesEventDispatched = true;
        } else {
            console.error("linesAnimation.js: Cannot dispatch event, #bg-canvas is null.");
        }
    }

    // Animation is fully complete (all lines drawn)
    if (!isAnimationComplete && currentLineIndex >= designLines.length) {
        isAnimationComplete = true;
    }

    // Animate camera based on mouse
    camera.position.x += (mouseX - camera.position.x) * cameraMovementFactor;
    camera.position.y += (-mouseY - camera.position.y) * cameraMovementFactor;
    camera.lookAt(scene.position);

    // Gentle rotation of the final design
    if (linesGroup) {
        linesGroup.rotation.z += rotationFactor;
    }

    renderer.render(scene, camera);
}