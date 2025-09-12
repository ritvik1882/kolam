// -- PARTICLE EFFECT --

import * as THREE from 'three';

// --- Parameters
const durationFactor = 0.5;
const designDensity = 700;
const designSize = 700;
const contentDisplayDelay = 2500;
const cameraMovementFactor = 0.003;
const rotationFactor = 0.0002;

// --- Scene Setup
let scene, camera, renderer, particles;
let mouseX = 0, mouseY = 0;
const windowHalfX = window.innerWidth / 2;
const windowHalfY = window.innerHeight / 2;
let animationProgress = 0;

const bgCanvas = document.querySelector('#bg-canvas');
const startupAnimationComplete = new CustomEvent('startupAnimationComplete');

// --- Design Generation Logic
function generateKolamPoints() {
    const points = [];
    const numPetals = 12; // Number of symmetrical petals
    const angleIncrement = (Math.PI * 2) / numPetals;

    // --- Layer 1: Outer Petals
    const pointsPerPetal = designDensity;
    const petalRadius = designSize;
    for (let i = 0; i < numPetals; i++) {
        const petalAngle = i * angleIncrement;
        for (let j = 0; j < pointsPerPetal; j++) {
            const t = (j / pointsPerPetal) * Math.PI; // 0 to PI for a full loop

            // Using a rhodonea curve (rose curve) for a floral shape
            const k = 4;
            const r = petalRadius * Math.sin(k * t) * (Math.sin(t * 0.5)); // Added modulation for shape

            const localX = r * Math.cos(t);
            const localY = r * Math.sin(t);
            const z = Math.sin(t * 8) * 25;

            // Rotate the point to its petal position
            const x = localX * Math.cos(petalAngle) - localY * Math.sin(petalAngle);
            const y = localX * Math.sin(petalAngle) + localY * Math.cos(petalAngle);

            points.push(new THREE.Vector3(x, y, z));
        }
    }

    // --- Layer 2: Inner Swirls
    const innerRadius = designSize / 3;
    const innerPoints = designDensity * 1;
    for (let i = 0; i < innerPoints; i++) {
        const angle = (i / innerPoints) * Math.PI * 6; // More turns
        const r = innerRadius * (i / innerPoints);
        const x = r * Math.cos(angle);
        const y = r * Math.sin(angle);
        const z = Math.sin(angle * 5) * 20;
        points.push(new THREE.Vector3(x, y, z));
    }

    return points;
}

// --- Easing function for smooth animation ---
function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// --- Initialise particles
export function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 3000);
    camera.position.z = 1000;

    renderer = new THREE.WebGLRenderer({
        canvas: document.getElementById('bg-canvas'),
        antialias: true,
        alpha: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);

    const targetPoints = generateKolamPoints();
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

        // Color: shades of rich gold and orange for a festive look
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

// --- Animation Loop ---
export function animate() {
    requestAnimationFrame(animate);

    const time = Date.now() * durationFactor;

    // Forming the Kolam
    if (animationProgress < 1.0) {
        animationProgress += 0.001;
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


// -- LINES EFFECT --
// import * as THREE from 'three';
//
// // --- Parameters
// const contentDisplayDelay = 2500;
// const cameraMovementFactor = 0.003;
// const rotationFactor = 0.0002;
//
// // --- Scene Setup ---
// let scene, camera, renderer, kolamLines = [], linesGroup;
// let mouseX = 0, mouseY = 0;
// const windowHalfX = window.innerWidth / 2;
// const windowHalfY = window.innerHeight / 2;
//
// let currentLineIndex = 0;
// let drawnPointsCount = 0;
// let isAnimationComplete = false;
//
// const bgCanvas = document.querySelector('#bg-canvas');
// const startupAnimationComplete = new CustomEvent('startupAnimationComplete');
//
// // --- Rangoli Generation Logic ---
// function generateRangoliPaths() {
//   const paths = []; // An array to hold arrays of points (each is a line)
//   const numPetals = 12; // Number of symmetrical petals
//   const angleIncrement = (Math.PI * 2) / numPetals;
//
//   // --- Layer 1: Outer Petals ---
//   const pointsPerPetal = 180;
//   const petalRadius = 400;
//   for (let i = 0; i < numPetals; i++) {
//     const petalPoints = [];
//     const petalAngle = i * angleIncrement;
//     for (let j = 0; j < pointsPerPetal; j++) {
//       const t = (j / (pointsPerPetal - 1)) * Math.PI; // Go from 0 to PI
//
//       // Using a rhodonea curve (rose curve) for a floral shape
//       const k = 4;
//       const r = petalRadius * Math.sin(k * t) * (Math.sin(t * 0.5));
//
//       const localX = r * Math.cos(t);
//       const localY = r * Math.sin(t);
//       const z = Math.sin(t * 8) * 25;
//
//       // Rotate the point to its petal position
//       const x = localX * Math.cos(petalAngle) - localY * Math.sin(petalAngle);
//       const y = localX * Math.sin(petalAngle) + localY * Math.cos(petalAngle);
//
//       petalPoints.push(new THREE.Vector3(x, y, z));
//     }
//     paths.push(petalPoints);
//   }
//
//   // --- Layer 2: Inner Swirls ---
//   const swirlPoints = [];
//   const innerRadius = 120;
//   const innerPoints = 600;
//   for (let i = 0; i < innerPoints; i++) {
//     const angle = (i / innerPoints) * Math.PI * 6; // More turns
//     const r = innerRadius * (i / innerPoints);
//     const x = r * Math.cos(angle);
//     const y = r * Math.sin(angle);
//     const z = Math.sin(angle * 5) * 20;
//     swirlPoints.push(new THREE.Vector3(x, y, z));
//   }
//   paths.push(swirlPoints);
//
//   return paths;
// }
//
// // --- Main Initialization Function ---
// export function init() {
//   scene = new THREE.Scene();
//   camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 3000);
//   camera.position.z = 1000;
//
//   renderer = new THREE.WebGLRenderer({
//     canvas: document.getElementById('bg-canvas'),
//     antialias: true,
//     alpha: true
//   });
//   renderer.setSize(window.innerWidth, window.innerHeight);
//
//   linesGroup = new THREE.Group();
//   scene.add(linesGroup);
//
//   const rangoliPaths = generateRangoliPaths();
//
//   const material = new THREE.LineBasicMaterial({
//     color: 0xFFD700,
//     transparent: true,
//     opacity: 0.9,
//   });
//
//   rangoliPaths.forEach(pathPoints => {
//     if (pathPoints.length > 1) {
//       const geometry = new THREE.BufferGeometry().setFromPoints(pathPoints);
//       const line = new THREE.Line(geometry, material);
//       line.geometry.setDrawRange(0, 0); // Initially hide the line
//       kolamLines.push(line);
//       linesGroup.add(line);
//     }
//   });
//
//   document.body.addEventListener('pointermove', onPointerMove);
//   window.addEventListener('resize', onWindowResize);
// }
//
// // --- Event Handlers ---
// function onPointerMove(event) {
//   mouseX = event.clientX - windowHalfX;
//   mouseY = event.clientY - windowHalfY;
// }
//
// function onWindowResize() {
//   camera.aspect = window.innerWidth / window.innerHeight;
//   camera.updateProjectionMatrix();
//   renderer.setSize(window.innerWidth, window.innerHeight);
// }
//
// // --- Animation Loop ---
// export function animate() {
//   requestAnimationFrame(animate);
//
//   // --- Phase 1: Drawing the Rangoli ---
//   if (!isAnimationComplete && currentLineIndex < kolamLines.length) {
//     const currentLine = kolamLines[currentLineIndex];
//     const totalPoints = currentLine.geometry.attributes.position.count;
//
//     // Speed up drawing by incrementing more than 1 point per frame
//     drawnPointsCount = Math.min(drawnPointsCount + 10, totalPoints);
//     currentLine.geometry.setDrawRange(0, drawnPointsCount);
//
//     // If the current line is finished, move to the next one
//     if (drawnPointsCount >= totalPoints) {
//       drawnPointsCount = 0;
//       currentLineIndex++;
//     }
//   }
//   // --- Phase 2: Animation is complete ---
//   else if (!isAnimationComplete) {
//     isAnimationComplete = true;
//     setTimeout(() => bgCanvas.dispatchEvent(startupAnimationComplete), contentDisplayDelay);
//   }
//
//   // Animate camera based on mouse
//   camera.position.x += (mouseX - camera.position.x) * cameraMovementFactor;
//   camera.position.y += (-mouseY - camera.position.y) * cameraMovementFactor;
//   camera.lookAt(scene.position);
//
//   // Gentle rotation of the final design
//   if (linesGroup) {
//     linesGroup.rotation.z += rotationFactor;
//   }
//
//   renderer.render(scene, camera);
// }

