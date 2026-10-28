/**
 * MonthLabel3D — กล่องนูนแสดง short month (JAN, FEB, ...)
 * ขนาดเท่ากล่องวัน (กว้าง×ลึก) แต่สูง 25% ของกล่องวัน, ไม่มีกรอบ
 * ข้อความพิมพ์บนหน้าด้านบน อ่านได้จาก top-view
 * วางที่ z = MONTH_TEXT_Z
 *
 * การวาง label:
 * - แต่ละเดือนที่ปรากฏใน window จะมี label ของตัวเอง (มากสุด 2 เมื่อข้ามเดือน)
 * - วางไว้ที่ "วันของเดือนนั้นที่ใกล้ focus day ที่สุด"
 *   → กรณีรอยต่อ (เช่น focus = 1 NOV) OCT จะอยู่ที่ 31 OCT (index 2)
 *     และ NOV อยู่ที่ 1 NOV (index 3) => สอง label อยู่ติดกันที่รอยต่อเดือน
 */
import * as THREE from 'three';
import { BOX, MONTH_SHORT_EN, MONTH_TEXT_Y, MONTH_TEXT_Z } from '../config.js';
import { createCanvas, canvasToTexture } from '../utils/canvas.js';

const MONTH_BOX_HEIGHT = BOX.height * 0.25;

export class MonthLabel3D {
    /**
     * @param {THREE.Scene} scene
     * @param {number} [z] ตำแหน่ง Z เริ่มต้น (ถ้าไม่ระบุใช้ MONTH_TEXT_Z)
     */
    constructor(scene, z = MONTH_TEXT_Z) {
        this.scene = scene;
        this.group = new THREE.Group();
        scene.add(this.group);
        this.positionZ = z;
    }

    /**
     * ตั้งตำแหน่ง Z ของกล่องเดือน + อัปเดตของที่ بناءอยู่ทันที
     * @param {number} z
     */
    setZ(z) {
        this.positionZ = z;
        this.group.children.forEach((child) => {
            child.position.z = z;
        });
    }

    /**
     * @returns {number}
     */
    getZ() {
        return this.positionZ;
    }

    clear() {
        while (this.group.children.length) {
            const child = this.group.children[0];
            this.group.remove(child);
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                const mats = Array.isArray(child.material) ? child.material : [child.material];
                mats.forEach((m) => {
                    if (m.map) m.map.dispose();
                    m.dispose();
                });
            }
        }
    }

    /**
     * อัปเดต label ตามวันที่ที่ render อยู่
     * @param {import('./CalendarGrid.js').CalendarGrid} calendarGrid
     * @param {Date} focusDate
     */
    update(calendarGrid, focusDate) {
        this.clear();

        const { dates } = calendarGrid;
        if (!dates || !dates.length) return;

        // จัดกลุ่มวันตามเดือน: key "year-month" -> วันที่ใกล้ focus ที่สุดของเดือนนั้น
        const nearestByMonth = new Map();
        for (const date of dates) {
            const key = `${date.getFullYear()}-${date.getMonth()}`;
            const dist = Math.abs(date - focusDate);
            const prev = nearestByMonth.get(key);
            if (!prev || dist < prev.dist) {
                nearestByMonth.set(key, { date, dist });
            }
        }

        for (const [, { date }] of nearestByMonth) {
            const posX = calendarGrid.getXForDate(date);
            if (posX === null) continue;
            this.group.add(this._createMonthBox(date.getMonth(), posX));
        }
    }

    _createMonthBox(month, posX) {
        const text = MONTH_SHORT_EN[month] ?? '';

        const geo = new THREE.BoxGeometry(BOX.width, MONTH_BOX_HEIGHT, BOX.depth);
        const sideMat = new THREE.MeshStandardMaterial({
            color: 0x1a1a2e,
            roughness: 0.6,
            metalness: 0.2,
        });
        const topMat = new THREE.MeshBasicMaterial({
            map: this._createTopTexture(text),
            transparent: true,
        });

        // BoxGeometry material order: +x, -x, +y, -y, +z, -z
        const mats = [sideMat, sideMat, topMat, sideMat, sideMat, sideMat];
        const box = new THREE.Mesh(geo, mats);
        box.position.set(posX, MONTH_TEXT_Y, this.positionZ);
        box.castShadow = true;
        box.receiveShadow = true;
        return box;
    }

    _createTopTexture(text) {
        const { canvas, ctx } = createCanvas(256);
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#ffaa33';
        ctx.font = 'bold 130px "Kanit", "Arial", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, canvas.width / 2, canvas.height / 2 + 8);

        const texture = canvasToTexture(canvas);
        texture.anisotropy = 4;
        return texture;
    }
}
