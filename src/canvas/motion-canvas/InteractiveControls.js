import EventEmitter from 'eventemitter3';
import * as THREE from 'three';
import browser from 'browser-detect';

import { passiveEvent } from '../utils/event.utils.js';

export default class InteractiveControls {

	get enabled() { return this._enabled; }

	constructor(camera, el) {
		this.emitter = new EventEmitter();

		this.camera = camera;
		this.el = el || window;

		this.plane = new THREE.Plane();
		this.raycaster = new THREE.Raycaster();

		this.mouse = new THREE.Vector2();
		this.offset = new THREE.Vector3();
		this.intersection = new THREE.Vector3();
		
		this.objects = [];
		this.hovered = null;
		this.selected = null;

		this.isDown = false;

		this.browser = browser();

		this.enable();
		console.log('InteractiveControls: initialized');
	}

	enable() {
		console.log('InteractiveControls: enable() called. Current _enabled state:', this._enabled);
		if (this.enabled) return;
		this.addListeners();
		this._enabled = true;
		console.log('InteractiveControls: enabled');
	}

	disable() {
		if (!this.enabled) return;
		this.removeListeners();
		this._enabled = false;
		console.log('InteractiveControls: disabled');
	}

	addListeners() {
		this.handlerDown = this.onDown.bind(this);
		this.handlerMove = this.onMove.bind(this);
		this.handlerUp = this.onUp.bind(this);
		this.handlerLeave = this.onLeave.bind(this);

		if (this.browser.mobile) {
			this.el.addEventListener('touchstart', this.handlerDown, passiveEvent);
			this.el.addEventListener('touchmove', this.handlerMove, passiveEvent);
			this.el.addEventListener('touchend', this.handlerUp, passiveEvent);
			console.log('InteractiveControls: Added touch listeners');
		}
		else {
			this.el.addEventListener('mousedown', this.handlerDown);
			this.el.addEventListener('mousemove', this.handlerMove);
			this.el.addEventListener('mouseup', this.handlerUp);
			this.el.addEventListener('mouseleave', this.handlerLeave);
			console.log('InteractiveControls: Added mouse listeners');
		}
	}

	removeListeners() {
		if (this.browser.mobile) {
			this.el.removeEventListener('touchstart', this.handlerDown);
			this.el.removeEventListener('touchmove', this.handlerMove);
			this.el.removeEventListener('touchend', this.handlerUp);
		}
		else {
			this.el.removeEventListener('mousedown', this.handlerDown);
			this.el.removeEventListener('mousemove', this.handlerMove);
			this.el.removeEventListener('mouseup', this.handlerUp);
			this.el.removeEventListener('mouseleave', this.handlerLeave);
		}
		console.log('InteractiveControls: Removed mouse listeners');
	}

	resize(x, y, width, height) {
		if (x || y || width || height) {
			this.rect = { x, y, width, height };
		}
		else if (this.el === window) {
			this.rect = { x: 0, y: 0, width: window.innerWidth, height: window.innerHeight };
		}
		else {
			const r = this.el.getBoundingClientRect();
			this.rect = { x: r.left, y: r.top, width: r.width, height: r.height };
		}
		console.log('InteractiveControls: resized', this.rect);
	}

	onMove(e) {
		// console.log('InteractiveControls: onMove', e.type); // Too frequent
		const t = (e.touches) ? e.touches[0] : e;
		const touch = { x: t.clientX, y: t.clientY };

		this.mouse.x = ((touch.x - this.rect.x) / this.rect.width) * 2 - 1;
		this.mouse.y = -((touch.y - this.rect.y) / this.rect.height) * 2 + 1;

		this.raycaster.setFromCamera(this.mouse, this.camera);

		const intersects = this.raycaster.intersectObjects(this.objects);

		if (intersects.length > 0) {
			const object = intersects[0].object;
			this.intersectionData = intersects[0];

			this.plane.setFromNormalAndCoplanarPoint(this.camera.getWorldDirection(this.plane.normal), object.position);

			if (this.hovered !== object) {
				this.emitter.emit('interactive-out', { object: this.hovered });
				this.emitter.emit('interactive-over', { object });
				this.hovered = object;
				// console.log('InteractiveControls: emitted interactive-over', object.uuid); // Too frequent
			}
			else {
				this.emitter.emit('interactive-move', { object, intersectionData: this.intersectionData });
				// console.log('InteractiveControls: emitted interactive-move', object.uuid); // Too frequent
			}
		}
		else {
			this.intersectionData = null;

			if (this.hovered !== null) {
				this.emitter.emit('interactive-out', { object: this.hovered });
				this.hovered = null;
				// console.log('InteractiveControls: emitted interactive-out'); // Too frequent
			}
		}
	}

	onDown(e) {
		console.log('InteractiveControls: onDown', e.type);
		this.isDown = true;
		this.onMove(e);

		this.emitter.emit('interactive-down', { object: this.hovered, previous: this.selected, intersectionData: this.intersectionData });
		this.selected = this.hovered;
		// console.log('InteractiveControls: emitted interactive-down', this.hovered ? this.hovered.uuid : 'none'); // Too frequent

		if (this.selected) {
			if (this.raycaster.ray.intersectPlane(this.plane, this.intersection)) {
				this.offset.copy(this.intersection).sub(this.selected.position);
			}
		}
	}

	onUp(e) {
		console.log('InteractiveControls: onUp', e.type);
		this.isDown = false;

		this.emitter.emit('interactive-up', { object: this.hovered });
		// console.log('InteractiveControls: emitted interactive-up', this.hovered ? this.hovered.uuid : 'none'); // Too frequent
	}

	onLeave(e) {
		console.log('InteractiveControls: onLeave', e.type);
		this.onUp(e);
		
		this.emitter.emit('interactive-out', { object: this.hovered });
		// console.log('InteractiveControls: emitted interactive-out', this.hovered ? this.hovered.uuid : 'none'); // Too frequent
		this.hovered = null;
	}

	addListener(event, listener) {
		this.emitter.addListener(event, listener);
		console.log(`InteractiveControls: Listener added for ${event}`);
	}

	removeListener(event, listener) {
		this.emitter.removeListener(event, listener);
		console.log(`InteractiveControls: Listener removed for ${event}`);
	}
}