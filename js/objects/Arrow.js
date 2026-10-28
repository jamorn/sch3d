/**
 * Arrow — ลูกศรแดงชี้วันที่เลือก
 */
import * as THREE from 'three';
import { BOX, COLORS } from '../config.js';

export class Arrow {
    /**
     * @param {THREE.Scene} scene
     * @param {import('./CalendarGrid.js').CalendarGrid} calendarGrid
     */
    constructor(scene, calendarGrid) {
        this.scene = scene;
        this.calendarGrid = calendarGrid;
        this.current = null;
        this.enabled = true;
    }

    /**
     * เปิด/ปิดลูกศร (เช่น ซ่อนบน non-desktop)
     * @param {boolean} enabled
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        if (!enabled) this._remove();
    }

    /**
     * เลื่อนลูกศรไปยังวันที่กำหนด (หรือซ่อนถ้าไม่ถูกต้อง)
     * @param {Date} targetDate
     */
    update(targetDate) {
        this._remove();
        if (!this.enabled) return;
        if (!targetDate) return;

        const targetX = this.calendarGrid.getXForDate(targetDate);
        if (targetX === null) return;

        this.current = this._create(targetX, 0, BOX.height);
        this.scene.add(this.current);
    }

    _remove() {
        if (this.current) {
            this.scene.remove(this.current);
            this.current = null;
        }
    }

    _create(targetX, targetZ = 0, heightY = 0.5) {
        const group = new THREE.Group();

        const cyl = new THREE.Mesh(
            new THREE.CylinderGeometry(0.1, 0.1, 2.5),
            new THREE.MeshStandardMaterial({ color: COLORS.arrow, emissive: COLORS.arrowEmissive }),
        );
        cyl.position.y = 1.25;
        cyl.castShadow = true;
        cyl.receiveShadow = true;
        group.add(cyl);

        const cone = new THREE.Mesh(
            new THREE.ConeGeometry(0.4, 1.0),
            new THREE.MeshStandardMaterial({ color: COLORS.arrowCone, emissive: COLORS.arrowEmissive }),
        );
        cone.position.y = 3.0;
        cone.castShadow = true;
        cone.receiveShadow = true;
        group.add(cone);

        group.position.set(targetX, heightY + 2.0, targetZ);
        return group;
    }
}
