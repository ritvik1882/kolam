import { GUI as LilGUI } from 'lil-gui';

export default class GUI {

	constructor(app) {
		this.app = app;

		this.particlesHitArea = false;
		this.particlesRandom = 2;
		this.particlesDepth = 2;
		this.particlesSize = 0.3;

		this.touchRadius = 0.2;
		this.rotationSpeed = 0.03;
		this.disableRotation = false;


		this.range = [0, 1];
		this.rangeRandom = [1, 10];
		this.rangeSize = [0, 3];
		this.rangeDepth = [1, 10];
		this.rangeRadius = [0, 0.5];
		this.rangeRotationSpeed = [0, 0.5];

		this.initLilGUI();
	}

	initLilGUI() {
		this.gui = new LilGUI({ width: 300 });
		// this.gui.hide(); // Hides GUI by default

		this.gui.add(this, 'touchRadius', this.rangeRadius[0], this.rangeRadius[1]).name('Touch radius').onChange(this.onTouchChange.bind(this));
        this.gui.add(this, 'particlesRandom', this.rangeRandom[0], this.rangeRandom[1]).name('Noise').onChange(this.onParticlesChange.bind(this));
		this.gui.add(this, 'particlesDepth', this.rangeDepth[0], this.rangeDepth[1]).name('Depth').onChange(this.onParticlesChange.bind(this));
		this.gui.add(this, 'particlesSize', this.rangeSize[0], this.rangeSize[1]).name('Particle size').onChange(this.onParticlesChange.bind(this));
		this.gui.add(this, 'rotationSpeed', this.rangeRotationSpeed[0], this.rangeRotationSpeed[1]).name('Rotation Speed').onChange(this.onRotationSpeedChange.bind(this));
		this.gui.add(this, 'disableRotation').name('Disable Rotation').onChange(this.onDisableRotationChange.bind(this));
	}

	// ---------------------------------------------------------------------------------------------
	// PUBLIC
	// ---------------------------------------------------------------------------------------------

	update() {}

	enable() {
		this.gui.show();
		this.gui.hidden = false;
	}

	disable() {
		this.gui.hide();
		this.gui.hidden = true;
	}

	toggle() {
		if (this.gui.hidden) this.enable();
		else this.disable();
	}

	onTouchChange() {
		if (!this.app.webgl) return;
		if (!this.app.webgl.particles) return;

		this.app.webgl.particles.touch.radius = this.touchRadius;
	}

	onParticlesChange() {
		if (!this.app.webgl) return;
		if (!this.app.webgl.particles) return;

		this.app.webgl.particles.object3D.material.uniforms.uRandom.value = this.particlesRandom;
		this.app.webgl.particles.object3D.material.uniforms.uDepth.value = this.particlesDepth;
		this.app.webgl.particles.object3D.material.uniforms.uSize.value = this.particlesSize;
	}

	onRotationSpeedChange() {
		if (!this.app.webgl) return;
		this.app.webgl.rotationSpeed = this.rotationSpeed;
	}

	onDisableRotationChange() {
		if (!this.app.webgl) return;
		this.app.webgl.disableRotation = this.disableRotation;
		if (this.disableRotation) {
			// Revert to initial state when rotation is disabled
			this.app.webgl.particles.container.rotation.z = this.app.webgl.initialContainerRotationZ;
		}
	}

}