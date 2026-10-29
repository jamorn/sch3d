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

        // ---------- เสา 2 สี (ครึ่งละ 50%) ----------
        const shaftRadius = 0.1;
        const shaftHeight = 2.5;

        // สี 1 (ครึ่งฝั่ง z+)
        const shaftA = new THREE.Mesh(
            new THREE.CylinderGeometry(
                shaftRadius, shaftRadius, shaftHeight,
                24, 1, true,
                0, Math.PI, // thetaStart 0, ครึ่งวง
            ),
            new THREE.MeshStandardMaterial({
                color: COLORS.arrow,
                emissive: COLORS.arrowEmissive,
                side: THREE.DoubleSide,
            }),
        );
        shaftA.position.y = shaftHeight / 2;
        shaftA.castShadow = false;
        shaftA.receiveShadow = false;
        group.add(shaftA);

        // สี 2 (ครึ่งฝั่ง z-) — สลับสี
        const shaftB = new THREE.Mesh(
            new THREE.CylinderGeometry(
                shaftRadius, shaftRadius, shaftHeight,
                24, 1, true,
                Math.PI, Math.PI, // thetaStart π, ครึ่งวงตรงข้าม
            ),
            new THREE.MeshStandardMaterial({
                color: ARROW.stripe.color,
                side: THREE.DoubleSide,
            }),
        );
        shaftB.position.y = shaftHeight / 2;
        shaftB.castShadow = false;
        shaftB.receiveShadow = false;
        group.add(shaftB);

        // ---------- หัวหมวก (cone) 2 สี สลับฝั่งกับเสา 50/50 ----------
        const coneRadius = 0.4;
        const coneHeight = 1.0;

        // สี 1 (แดง) ฝั่ง z+ — ตรงข้ามกับเสาที่เป็นเหลืองฝั่ง z+
        const coneA = new THREE.Mesh(
            new THREE.ConeGeometry(
                coneRadius, coneHeight,
                24, 1, true,
                0, Math.PI, // thetaStart 0, ครึ่งวง
            ),
            new THREE.MeshStandardMaterial({
                color: COLORS.arrowCone,
                emissive: COLORS.arrowEmissive,
                side: THREE.DoubleSide,
            }),
        );
        coneA.position.y = 3.0;
        coneA.castShadow = false;
        coneA.receiveShadow = false;
        group.add(coneA);

        // สี 2 (เหลือง) ฝั่ง z- — ตรงข้ามกับเสาที่เป็นแดงฝั่ง z-
        const coneB = new THREE.Mesh(
            new THREE.ConeGeometry(
                coneRadius, coneHeight,
                24, 1, true,
                Math.PI, Math.PI, // thetaStart π, ครึ่งวงตรงข้าม
            ),
            new THREE.MeshStandardMaterial({
                color: ARROW.stripe.color,
                side: THREE.DoubleSide,
            }),
        );
        coneB.position.y = 3.0;
        coneB.castShadow = false;
        coneB.receiveShadow = false;
        group.add(coneB);

        group.position.set(x, this._baseY, z);
        group.scale.setScalar(ARROW.scale);
        return group;
    }
}
