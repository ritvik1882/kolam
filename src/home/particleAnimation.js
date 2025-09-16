import * as THREE from 'three';

export {init, animate };

// Parameters
const animationProgressIncrement = 0.0004; // controls animation speed
const contentDisplayDelay = 2000;
const noiseAmount = 5;
const designDensity = 700;
const designSize = 700;
const cameraMovementFactor = 0.003;
const rotationFactor = 0.0002;

// Scene setup
let scene, camera, renderer, particles;
let mouseX = 0, mouseY = 0;
const windowHalfX = window.innerWidth / 2;
const windowHalfY = window.innerHeight / 2;
let animationProgress = 0;
let particleEventDispatched = false; // Flag to ensure event is dispatched only once

const bgCanvas = document.querySelector('#bg-canvas');
const startupAnimationComplete = new CustomEvent('startupAnimationComplete');

// Design Generation
function generateDesignPoints() {
    const points = [];
    const numPetals = 12; // Number of symmetrical petals
    const angleIncrement = (Math.PI * 2) / numPetals;

    const pointsPerPetal = designDensity;
    const petalRadius = designSize;
    for (let i = 0; i < numPetals; i++) {
        const petalAngle = i * angleIncrement;
        for (let j = 0; j < pointsPerPetal; j++) {
            const t = (j / pointsPerPetal) * Math.PI; // 0 to PI for a full loop

            // Using a rhodonea curve (rose curve) for a floral shape
            const k = 4;
            const r = petalRadius * Math.sin(k * t) * (Math.sin(t * 0.5)); // Added modulation for shape

            let localX = r * Math.cos(t);
            let localY = r * Math.sin(t);
            let z = Math.sin(t * 8) * 25;

            // Add noise
            localX += (Math.random() - 0.5) * noiseAmount;
            localY += (Math.random() - 0.5) * noiseAmount;
            z += (Math.random() - 0.5) * noiseAmount;

            // Rotate the point to its petal position
            const x = localX * Math.cos(petalAngle) - localY * Math.sin(petalAngle);
            const y = localX * Math.sin(petalAngle) + localY * Math.cos(petalAngle);

            points.push(new THREE.Vector3(x, y, z));
        }
    }

    return points;
}

// Easing function for smooth animation
function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// Initialise particles
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

    const targetPoints = generateDesignPoints();
    const particleCount = targetPoints.length;

    const initialPositions = new Float32Array(particleCount * 3);
    const targetPositions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const color = new THREE.Color();

    for (let i = 0; i < particleCount; i++) {
        // Initial position: random point in a large sphere
        const i3 = i * 3;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);
        const radius = 1000 + Math.random() * 500;
        initialPositions[i3] = radius * Math.sin(phi) * Math.cos(theta);
        initialPositions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        initialPositions[i3 + 2] = radius * Math.cos(phi);

        // Target position: from our generated kolam
        targetPositions[i3] = targetPoints[i].x;
        targetPositions[i3 + 1] = targetPoints[i].y;
        targetPositions[i3 + 2] = targetPoints[i].z;

        // Color
        const hue = 0.1 + Math.random() * 0.04;     // yellow to orange-yellow
        const saturation = 0.9 + Math.random() * 0.1; // very saturated
        const lightness = 0.6 + Math.random() * 0.1;  // bright and glowing
        color.setHSL(hue, saturation, lightness);
        colors[i3] = color.r;
        colors[i3 + 1] = color.g;
        colors[i3 + 2] = color.b;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(initialPositions, 3));
    geometry.setAttribute('target_position', new THREE.BufferAttribute(targetPositions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
        size: 3,
        vertexColors: true,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        opacity: 0.8
    });

    particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // Event handlers
    document.body.addEventListener('pointermove', (event) => {
        mouseX = event.clientX - windowHalfX;
        mouseY = event.clientY - windowHalfY;
    });
    window.addEventListener('resize', (event) => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

// Animation Loop
function animate() {
    requestAnimationFrame(animate);

    const time = Date.now() * 0.5;

    // Forming the Design
    if (animationProgress < 1.0) {
        animationProgress += animationProgressIncrement;
        animationProgress = Math.min(animationProgress, 1.0); // Clamp at 1

        const easedProgress = easeInOutCubic(animationProgress);

        const currentPositions = particles.geometry.attributes.position;
        const initialPositions = particles.geometry.attributes.position.array; // We are re-using this buffer
        const targetPositions = particles.geometry.attributes.target_position.array;

        for (let i = 0; i < currentPositions.count; i++) {
            const i3 = i * 3;
            const ix = initialPositions[i3];
            const iy = initialPositions[i3 + 1];
            const iz = initialPositions[i3 + 2];

            const tx = targetPositions[i3];
            const ty = targetPositions[i3 + 1];
            const tz = targetPositions[i3 + 2];

            // Lerp (linear interpolation) from start to target
            currentPositions.array[i3] = ix + (tx - ix) * easedProgress;
            currentPositions.array[i3 + 1] = iy + (ty - iy) * easedProgress;
            currentPositions.array[i3 + 2] = iz + (tz - iz) * easedProgress;
        }
        currentPositions.needsUpdate = true;
    }

    // Trigger to display content
    setTimeout(() => bgCanvas.dispatchEvent(startupAnimationComplete), contentDisplayDelay);

    // Animate camera based on mouse
    camera.position.x += (mouseX - camera.position.x) * cameraMovementFactor;
    camera.position.y += (-mouseY - camera.position.y) * cameraMovementFactor;
    camera.lookAt(scene.position);

    // Gentle rotation of the final design
    if (particles) {
        particles.rotation.z = time * rotationFactor;
    }

    renderer.render(scene, camera);
}