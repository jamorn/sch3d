/**
 * DayHeaderLabels — label ชื่อวันย่อ 3 ตัวอักษร (Mon, Tue, ...)
 * วางลอยเหนือ humanoid ทุกวันใน window ที่ Y เท่ากันหมด (billboard หันหากล้อง)
 */
import * as THREE from 'three';
import { BOX, DAY_LABEL_Y, DAY_LABEL_Z, WEEKDAY_SHORT } from '../config.js';
import { createCanvas, canvasToTexture } from '../utils/canvas.js';

export class DayHeaderLabels {
    /**
     * @param {THREE.Scene} scene
     * @param {import('./CalendarGrid.js').CalendarGrid} calendarGrid
     * @param {number} [z] ตำแหน่ง Z เริ่มต้น (ถ้าไม่ระบุใช้ DAY_LABEL_Z)
     */
    constructor(scene, calendarGrid, z = DAY_LABEL_Z) {
        this.scene = scene;
        this.calendarGrid = calendarGrid;
        this.group = new THREE.Group();
        scene.add(this.group);
        this.positionZ = z;
    }

    /**
     * ตั้งตำแหน่ง Z ของ label ชื่อวัน + อัปเดตของที่สร้างอยู่ทันที
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
            if (child.material) {
                if (child.material.map) child.material.map.dispose();
                child.material.dispose();
            }
        }
    }

    /**
     * สร้าง label ทุกวันใน window (เรียกหลัง calendarGrid.build)
     */
    build() {
        this.clear();

        const { dates } = this.calendarGrid;
        if (!dates || !dates.length) return;

        dates.forEach((date) => {
            const weekday = date.getDay();
            const shortName = WEEKDAY_SHORT[weekday];
            const posX = this.calendarGrid.getXForDate(date);
            if (posX === null) return;

            const sprite = this._createSprite(shortName, weekday);
            sprite.position.set(posX, DAY_LABEL_Y, this.positionZ);
            this.group.add(sprite);
        });
    }

    _createSprite(text, weekday) {
        const { canvas, ctx } = createCanvas(128);

        const isWeekend = weekday === 0 || weekday === 6;
        const bg = isWeekend ? 'rgba(200,60,60,0.92)' : 'rgba(40,70,120,0.92)';

        ctx.fillStyle = bg;
        ctx.beginPath();
        ctx.roundRect(8, 34, 112, 60, 16);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 46px "Kanit", "Arial", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 64, 64);

        const spriteMat = new THREE.SpriteMaterial({
            map: canvasToTexture(canvas),
            transparent: true,
            depthTest: false,
        });
        const sprite = new THREE.Sprite(spriteMat);
        sprite.scale.set(1.5, 1.5, 0.2);
        return sprite;
    }
}
