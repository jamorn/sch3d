/**
 * Arrow — ลูกศรแดงชี้วันที่เลือก (อยู่ด้านหลัง humanoid)
 * แอนิเมชัน: หมุนตามเข็มนาฬิกาช้าๆ + ขยับขึ้นลง (bob) แกน Y
 * - Desktop: bob เต็ม + หมุนปกติ
 * - Non-desktop (compact): หมุนช้า + bob น้อย + throttle เพื่อลดภาระ GPU
 */
import * as THREE from 'three';
import { COLORS, DEFAULT_CHARACTER_Z, ARROW } from '../config.js';

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
        this._compact = false;
        this._accum = 0; // สะสม delta สำหรับ throttle บน compact

        // พารามิเตอร์ตามโหมด (เริ่มที่ desktop)
        this._params = this._paramsFor(false);
    }

    /**
     * เปิด/ปิดลูกศร
     * @param {boolean} enabled
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        if (!enabled) this._remove();
    }

    /**
     * ตั้งโหมด compact (non-desktop): หมุนช้า + bob น้อย + throttle
     * @param {boolean} compact
     */
    setCompact(compact) {
        this._compact = compact;
        this._params = this._paramsFor(compact);
        // ถ้ามีลูกศรอยู่ ให้รีเซ็ต Y กลับฐานใหม่
        if (this.current) {
            this.current.position.y = this._baseY;
        }
    }

    /**
     * @param {boolean} compact
     * @returns {{rotatePeriod:number, bobSpeed:number, bobAmplitude:number, updateInterval:number}}
     */
    _paramsFor(compact) {
        if (compact) return ARROW.compact;
        return {
            rotatePeriod: ARROW.rotatePeriod,
            bobSpeed: ARROW.bobSpeed,
            bobAmplitude: ARROW.bobAmplitude,
            updateInterval: 0, // 0 = อัปเดตทุกเฟรม
        };
    }

    /**
     * เลื่อนลูกศรไปยังวันที่กำหนด
     * @param {Date} targetDate
     */
    update(targetDate) {
        this._remove();
        if (!this.enabled) return;
        if (!targetDate) return;

        const targetX = this.calendarGrid.getXForDate(targetDate);
        if (targetX === null) return;

        const targetZ = DEFAULT_CHARACTER_Z + ARROW.offsetZ;
        this.current = this._create(targetX, targetZ);
        this.scene.add(this.current);
    }

    /**
     * อัปเดตแอนิเมชัน — เรียกทุกเฟรม
     * @param {number} delta เวลาเป็นวินาที
     */
    animate(delta) {
        if (!this.current || !this.enabled) return;

        const { rotatePeriod, bobSpeed, bobAmplitude, updateInterval } = this._params;

        if (updateInterval > 0) {
            // throttle: สะสมเวลา แล้วอัปเดตไม่ถี่เกินไป
            this._accum += delta;
            if (this._accum < updateInterval) return;
            delta = this._accum;
            this._accum = 0;
        }

        this._elapsed += delta;

        // หมุนตามเข็มนาฬิกา (มองจากด้านบน = ทิศลบ)
        const angularSpeed = (2 * Math.PI) / rotatePeriod;
        this.current.rotation.y -= angularSpeed * delta;

        // bob ขึ้นลง
        this.current.position.y = this._baseY
            + Math.sin(this._elapsed * bobSpeed) * bobAmplitude;
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
     * สร้างลูกศร (เสาตั้ง + หัวลูกศรชี้ลง) เป็น group ที่หมุนได้รอบแกน Y
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
        cyl.castShadow = false;   // ไม่ทำเงา (กันภาระตอน animation)
        cyl.receiveShadow = false;
        group.add(cyl);

        const cone = new THREE.Mesh(
            new THREE.ConeGeometry(0.4, 1.0),
            new THREE.MeshStandardMaterial({ color: COLORS.arrowCone, emissive: COLORS.arrowEmissive }),
        );
        cone.position.y = 3.0;
        cone.castShadow = false;
        cone.receiveShadow = false;
        group.add(cone);

        group.position.set(x, this._baseY, z);
        group.scale.setScalar(ARROW.scale);
        return group;
    }
}
