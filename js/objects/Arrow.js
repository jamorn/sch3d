/**
 * Arrow — ลูกศรแดงชี้วันที่เลือก (อยู่ด้านหลัง humanoid)
 * มีแอนิเมชัน: หมุนรอบตัวเองช้าๆ + ขยับขึ้นลง (bob) ตามแกน Y
 */
import * as THREE from 'three';
import { BOX, COLORS, DEFAULT_CHARACTER_Z, ARROW } from '../config.js';

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

        // สถานะแอนิเมชัน
        this._elapsed = 0;
        this._baseY = ARROW.baseY;
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

        // อยู่ด้านหลัง humanoid ตามแนว Z
        const targetZ = DEFAULT_CHARACTER_Z + ARROW.offsetZ;
        this.current = this._create(targetX, targetZ);
        this.scene.add(this.current);
    }

    /**
     * อัปเดตแอนิเมชัน (หมุน + bob) — เรียกทุกเฟรม
     * @param {number} delta เวลาเป็นวินาทีที่ผ่านไปในเฟรมนี้
     */
    animate(delta) {
        if (!this.current || !this.enabled) return;
        this._elapsed += delta;

        // หมุนรอบแกน Y ตามเข็มนาฬิกา (มองจากด้านบน = ทิศลบ)
        const angularSpeed = (2 * Math.PI) / ARROW.rotatePeriod;
        this.current.rotation.y -= angularSpeed * delta;

        // ขยับขึ้นลงตาม sine
        this.current.position.y = this._baseY
            + Math.sin(this._elapsed * ARROW.bobSpeed) * ARROW.bobAmplitude;
    }

    _remove() {
        if (this.current) {
            this.scene.remove(this.current);
            this._dispose(this.current);
            this.current = null;
        }
    }

    _dispose(group) {
        group.traverse((child) => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                const mats = Array.isArray(child.material) ? child.material : [child.material];
                mats.forEach((m) => {
                    if (m.map) m.map.dispose();
                    m.dispose();
                });
            }
        });
    }

    /**
     * สร้างลูกศร (รูปทรงเหมือนเดิม: เสาตั้ง + หัวลูกศรชี้ลงอยู่บน)
     * เป็น group ที่หมุนได้รอบแกน Y
     * @param {number} x
     * @param {number} z
     */
    _create(x, z) {
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

        // ฐานวาง Y = baseY (ส่วน bob จะปรับ position.y ของ group)
        group.position.set(x, this._baseY, z);
        // ขยายขนาดลูกศรทั้ง group
        group.scale.setScalar(ARROW.scale);
        return group;
    }
}
