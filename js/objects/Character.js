/**
 * Character — ตัวละครสไตล์ Minecraft (บล็อกสี่เหลี่ยม)
 */
import * as THREE from 'three';
import { CHARACTER_BASE_Y } from '../config.js';

export class Character {
    /**
     * @param {THREE.Scene} scene
     * @param {import('./CalendarGrid.js').CalendarGrid} calendarGrid
     */
    constructor(scene, calendarGrid) {
        this.scene = scene;
        this.calendarGrid = calendarGrid;
        this.baseY = CHARACTER_BASE_Y;
        this.positionZ = 0;

        this.mesh = this._build();
        scene.add(this.mesh);
    }

    /**
     * กำหนดตำแหน่ง Z
     * @param {number} z
     */
    setZ(z) {
        this.positionZ = z;
    }

    /**
     * ย้ายตัวละครไปยังวันที่กำหนด
     * @param {Date} date
     */
    moveToDate(date) {
        if (!date) return;
        const targetX = this.calendarGrid.getXForDate(date);
        if (targetX === null) return;

        this.mesh.position.set(targetX, this.baseY, this.positionZ);
    }

    _build() {
        const group = new THREE.Group();

        const palette = {
            skin: 0xffcc99,
            shirt: 0x3366ff,
            pants: 0x2244aa,
            hair: 0x221c0f,
            black: 0x000000,
            mouth: 0xff6666,
            shoe: 0x111111,
            sole: 0xe5e7eb,
        };

        const addBox = (size, color, position) => {
            const mesh = new THREE.Mesh(
                new THREE.BoxGeometry(size[0], size[1], size[2]),
                new THREE.MeshStandardMaterial({ color }),
            );
            mesh.position.set(position[0], position[1], position[2]);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            group.add(mesh);
            return mesh;
        };

        // ลำตัว
        addBox([0.8, 0.9, 0.4], palette.shirt, [0, 1.0, 0]);
        // หัว
        addBox([0.6, 0.6, 0.4], palette.skin, [0, 1.75, 0]);
        // ผม
        addBox([0.65, 0.15, 0.45], palette.hair, [0, 2.08, 0]);
        // ตา
        addBox([0.1, 0.1, 0.1], palette.black, [-0.15, 1.85, 0.21]);
        addBox([0.1, 0.1, 0.1], palette.black, [0.15, 1.85, 0.21]);
        // ปาก
        addBox([0.25, 0.05, 0.1], palette.mouth, [0, 1.67, 0.21]);
        // แขน
        addBox([0.25, 1.0, 0.25], palette.shirt, [-0.55, 0.93, 0]);
        addBox([0.25, 1.0, 0.25], palette.shirt, [0.55, 0.93, 0]);
        // ขา
        addBox([0.28, 1.04, 0.28], palette.pants, [-0.25, 0.68, 0]);
        addBox([0.28, 1.04, 0.28], palette.pants, [0.25, 0.68, 0]);
        // รองเท้า
        addBox([0.34, 0.16, 0.48], palette.shoe, [-0.25, 0.08, 0.05]);
        addBox([0.34, 0.16, 0.48], palette.shoe, [0.25, 0.08, 0.05]);
        // พื้นรองเท้า
        addBox([0.34, 0.04, 0.48], palette.sole, [-0.25, 0.0, 0.05]);
        addBox([0.34, 0.04, 0.48], palette.sole, [0.25, 0.0, 0.05]);

        return group;
    }
}
