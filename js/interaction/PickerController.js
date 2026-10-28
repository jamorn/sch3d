/**
 * PickerController — จัดการ hover / raycast / touch tap / wheel ในฉาก 3D
 * แยกออกจาก App เพื่อให้ logic การเลือกกล่องอยู่ที่เดียว
 */
import * as THREE from 'three';
import { COLORS } from '../config.js';

export class PickerController {
    /**
     * @param {object} deps
     * @param {import('../core/SceneManager.js').SceneManager} deps.sceneManager
     * @param {import('./CalendarGrid.js').CalendarGrid} deps.calendarGrid
     * @param {import('../core/DeviceProfile.js').DeviceProfile} deps.deviceProfile
     * @param {(day:number, month:number, year:number)=>void} deps.onSelectDay
     */
    constructor({ sceneManager, calendarGrid, deviceProfile, onSelectDay }) {
        this.sceneManager = sceneManager;
        this.calendarGrid = calendarGrid;
        this.deviceProfile = deviceProfile;
        this.onSelectDay = onSelectDay;

        this.raycaster = new THREE.Raycaster();
        this.pointer = new THREE.Vector2();
        this.hoveredBox = null;
        this.touchStartPoint = null;
        this.touchMoved = false;

        this._bind();
    }

    // ---------- hover highlight ----------
    setHoveredBox(box) {
        if (this.hoveredBox === box) return;

        if (this.hoveredBox) {
            this.hoveredBox.material.emissive.setHex(this.hoveredBox.userData.baseEmissive);
        }
        this.hoveredBox = box;
        if (this.hoveredBox) {
            this.hoveredBox.material.emissive.setHex(COLORS.emissiveHover);
        }

        if (!this.sceneManager.isOrbiting && this.deviceProfile.hasHover) {
            this.sceneManager.setCursor(box ? 'pointer' : 'grab');
        }
    }

    pickBoxAt(event) {
        const canvas = this.sceneManager.renderer.domElement;
        const rect = canvas.getBoundingClientRect();
        this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        this.raycaster.setFromCamera(this.pointer, this.sceneManager.camera);

        const hits = this.raycaster.intersectObjects(this.calendarGrid.dayBoxes, false);
        return hits.length ? hits[0].object : null;
    }

    // ---------- events ----------
    _bind() {
        const canvas = this.sceneManager.renderer.domElement;

        canvas.addEventListener('pointerdown', (event) => this._onPointerDown(event));
        canvas.addEventListener('pointermove', (event) => this._onPointerMove(event));
        canvas.addEventListener('pointerleave', () => this._onPointerLeave());
        canvas.addEventListener('pointerup', (event) => this._onPointerUp(event));
        canvas.addEventListener('pointercancel', () => this._onPointerCancel());
        canvas.addEventListener('wheel', (event) => this._onWheel(event), {
            capture: true,
            passive: true,
        });
    }

    _onPointerDown(event) {
        if (event.pointerType !== 'touch') return;
        this.touchStartPoint = { x: event.clientX, y: event.clientY };
        this.touchMoved = false;
    }

    _onPointerMove(event) {
        if (event.pointerType === 'touch' && this.touchStartPoint) {
            const dx = Math.abs(event.clientX - this.touchStartPoint.x);
            const dy = Math.abs(event.clientY - this.touchStartPoint.y);
            if (dx > 10 || dy > 10) this.touchMoved = true;
        }

        if (!this.deviceProfile.hasHover || this.sceneManager.isOrbiting) return;
        this.setHoveredBox(this.pickBoxAt(event));
    }

    _onPointerLeave() {
        if (!this.deviceProfile.hasHover || this.sceneManager.isOrbiting) return;
        this.setHoveredBox(null);
    }

    _onPointerUp(event) {
        if (!this.deviceProfile.isTouchDevice || event.pointerType !== 'touch') {
            this.touchStartPoint = null;
            this.touchMoved = false;
            return;
        }

        if (!this.touchMoved) {
            const box = this.pickBoxAt(event);
            if (box) {
                const { day, month, year } = box.userData;
                this.onSelectDay?.(day, month, year);
            }
            this.setHoveredBox(null);
        }

        this.touchStartPoint = null;
        this.touchMoved = false;
    }

    _onPointerCancel() {
        this.touchStartPoint = null;
        this.touchMoved = false;
        if (!this.deviceProfile.hasHover) this.setHoveredBox(null);
    }

    _onWheel(event) {
        if (!this.deviceProfile.hasHover || this.sceneManager.isOrbiting) return;
        const box = this.pickBoxAt(event);
        this.setHoveredBox(box);
        if (box) this._focusBox(box);
    }

    _focusBox(box) {
        const focusPoint = box.position.clone();
        const offset = this.sceneManager.camera.position
            .clone()
            .sub(this.sceneManager.controls.target);
        this.sceneManager.focusAt(focusPoint, offset);
    }

    /**
     * รีเซ็ต hover (เรียกเมื่อ rebuild)
     */
    resetHover() {
        this.setHoveredBox(null);
    }
}
