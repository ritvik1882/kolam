import * as THREE from 'three';
import gsap from 'gsap';

import InteractiveControls from './InteractiveControls';
import Particles from '../motion/Particles';


export default class WebGLView {

	constructor(app, gui) {
		this.app = app;
		this.gui = gui; // Store the passed gui instance

		// visual gap from screen edges in pixels
		this.gutter = 48;

		// radians per second
		this.rotationSpeed = 0.03; // Initialize with a default value
		this.disableRotation = false; // New property for the checkbox

        // For testing
		this.samples = [
			'/images/1.png',
			'/images/2.png',
			'/images/3.png',
			'/images/4.png',
			'/images/5.png',
			'/images/6.png',
			// '/images/7.png',
			// '/images/8.png',
			// '/images/9.png',
			// '/images/10.png',
		];

		this.initThree();
		this.initParticles();
		this.initControls();

		// Store initial rotation (0 radians) after particles are initialized
		this.initialContainerRotationZ = 0;

		const rnd = ~~(Math.random() * this.samples.length);
		this.goto(rnd);
	}

	initThree() {
		// scene
		this.scene = new THREE.Scene();

		// camera
		this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 10000);
		this.camera.position.z = 300;

		// renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

        // clock
		this.clock = new THREE.Clock(true);
	}

	initControls() {
		this.interactive = new InteractiveControls(this.camera, this.renderer.domElement);
	}

	initParticles() {
		this.particles = new Particles(this);
		this.scene.add(this.particles.container);
	}

	// ---------------------------------------------------------------------------------------------
	// PUBLIC
	// ---------------------------------------------------------------------------------------------

	update() {
		const delta = this.clock.getDelta();

		if (this.particles) {
			this.particles.update(delta);

			if (this.disableRotation) {
				// Revert to initial state (0 radians) if rotation is disabled
				this.particles.container.rotation.z = this.initialContainerRotationZ;
			} else if (this.rotationSpeed !== 0) {
				// Apply rotation only if not disabled and speed is not zero
				this.particles.container.rotation.z += this.rotationSpeed * delta;
			}
		}
	}

	draw() {
		this.renderer.render(this.scene, this.camera);
	}


	goto(index) {
		// init next
		if (this.currSample == null) {
			this.particles.init(this.samples[index]);
			this.interactive.enable(); // Ensure interactive controls are enabled after initial load
		}
		// hide curr then init next
		else {
			this.particles.hide(true).then(() => {
				this.particles.init(this.samples[index]);
				this.interactive.enable(); // Ensure interactive controls are re-enabled after hiding and re-initializing
			});
		}

		this.currSample = index;
	}

	next() {
		if (this.currSample < this.samples.length - 1) this.goto(this.currSample + 1);
		else this.goto(0);
	}

	// ---------------------------------------------------------------------------------------------
	// EVENT HANDLERS
	// ---------------------------------------------------------------------------------------------

	resize() {
		if (!this.renderer) return;
		const width = window.innerWidth;
		const height = window.innerHeight;
		this.camera.aspect = width / height;
		this.camera.updateProjectionMatrix();

		this.fovHeight = 2 * Math.tan((this.camera.fov * Math.PI) / 180 / 2) * this.camera.position.z;

		this.renderer.setSize(width, height);

		if (this.interactive) this.interactive.resize();
		if (this.particles) this.particles.resize();
	}
}