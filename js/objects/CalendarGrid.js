/**
 * CalendarGrid — สร้าง/rebuild กล่องวันเฉพาะ window ±RENDER_WINDOW รอบวันโฟกัส
 * (ไม่ render ทั้งเดือน เพื่อความเร็ว — ทุก device)
 */
import * as THREE from 'three';
import { BOX, COLORS, RENDER_WINDOW, SHIFT_TEXT_COLOR, TEAMS } from '../config.js';
import { isToday, getDayWindow } from '../utils/date.js';
import { createCanvas, canvasToTexture } from '../utils/canvas.js';

export class CalendarGrid {
    /**
     * @param {import('three').Scene} scene
     * @param {import('../data/ShiftService.js').ShiftService} shiftService
     */
    constructor(scene, shiftService) {
        this.scene = scene;
        this.shiftService = shiftService;
        this.group = new THREE.Group();
        scene.add(this.group);

        /** @type {THREE.Mesh[]} */
        this.dayBoxes = [];

        /** @type {Date[]} วันที่ที่ render อยู่ */
        this.dates = [];
        // map key "year-month-day" -> { box, x }
        this._slotByKey = new Map();
        this.startX = 0;
        this.daysInMonth = 0;
    }

    /**
     * สร้าง key จาก Date
     * @param {Date} date
     */
    static keyOf(date) {
        return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    }

    /**
     * ตำแหน่ง X ของ slot ที่เรียงตาม index ใน window
     * @param {number} index index ใน this.dates (0-based)
     */
    getXForIndex(index) {
        return this.startX + index * (BOX.width + BOX.gapX);
    }

    /**
     * ตำแหน่ง X ของวันที่กำหนด (ถ้าอยู่ใน window)
     * @param {Date} date
     * @returns {number|null}
     */
    getXForDate(date) {
        const slot = this._slotByKey.get(CalendarGrid.keyOf(date));
        return slot ? slot.x : null;
    }

    /**
     * ตำแหน่ง Z ของแถวทีม (index)
     * @param {number} teamIndex
     */
    getZForTeam(teamIndex) {
        const rowSpan = TEAMS.length * (BOX.depth + BOX.gapZ);
        return teamIndex * (BOX.depth + BOX.gapZ) - rowSpan / 2 + BOX.depth / 2;
    }

    clear() {
        while (this.group.children.length) {
            const child = this.group.children[0];
            this.group.remove(child);
            // dispose เพื่อลด memory บน mobile
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                const mats = Array.isArray(child.material) ? child.material : [child.material];
                mats.forEach((m) => {
                    if (m.map) m.map.dispose();
                    m.dispose();
                });
            }
        }
        this.dayBoxes = [];
        this.dates = [];
        this._slotByKey.clear();
    }

    /**
     * สร้างกล่องรอบวันโฟกัส ±RENDER_WINDOW
     * @param {number} year
     * @param {number} month 0-11
     * @param {number} centerDay
     */
    build(year, month, centerDay) {
        this.clear();

        const dim = new Date(year, month + 1, 0).getDate();
        this.daysInMonth = dim;

        const dates = getDayWindow(year, month, centerDay, RENDER_WINDOW);
        this.dates = dates;

        const totalWidth = dates.length * (BOX.width + BOX.gapX) - BOX.gapX;
        const startX = -totalWidth / 2 + BOX.width / 2;
        this.startX = startX;

        for (let t = 0; t < TEAMS.length; t++) {
            const team = TEAMS[t];
            const posZ = this.getZForTeam(t);

            dates.forEach((date, idx) => {
                const posX = startX + idx * (BOX.width + BOX.gapX);
                this._createDayBox({ date, team, posX, posZ });
                this._slotByKey.set(CalendarGrid.keyOf(date), { x: posX });
            });
        }
    }

    _createDayBox({ date, team, posX, posZ }) {
        const d = date.getDate();
        const shift = this.shiftService.getShift(team.offset, date);
        const posY = BOX.height / 2;

        const current = isToday(date.getFullYear(), date.getMonth(), d);
        const boxColor = current ? COLORS.boxToday : COLORS.boxDefault;
        const baseEmissive = current ? COLORS.emissiveToday : 0x000000;

        const mat = new THREE.MeshStandardMaterial({
            color: boxColor,
            roughness: 0.4,
            metalness: 0.3,
            emissive: baseEmissive,
        });
        const geo = new THREE.BoxGeometry(BOX.width, BOX.height, BOX.depth);
        const box = new THREE.Mesh(geo, mat);
        box.castShadow = true;
        box.receiveShadow = true;
        box.position.set(posX, posY, posZ);
        box.userData = {
            day: d,
            month: date.getMonth(),
            year: date.getFullYear(),
            date,
            shift,
            team: team.id,
            baseEmissive,
        };

        this.group.add(box);
        this.dayBoxes.push(box);

        // ด้านบน: texture แสดงเลขวัน + ตัวอักษรกะ
        const topMat = new THREE.MeshStandardMaterial({
            map: this._createTopTexture(d, shift),
            side: THREE.DoubleSide,
            emissive: 0,
            roughness: 0.3,
            metalness: 0.1,
        });
        const topPlane = new THREE.Mesh(
            new THREE.PlaneGeometry(BOX.width * 0.9, BOX.depth * 0.9),
            topMat,
        );
        topPlane.rotation.x = -Math.PI / 2;
        topPlane.position.set(posX, BOX.height + 0.01, posZ);
        topPlane.receiveShadow = true;
        topPlane.castShadow = false;
        this.group.add(topPlane);
    }

    _createTopTexture(day, shift) {
        const { canvas, ctx } = createCanvas(256);
        const size = canvas.width;

        ctx.fillStyle = '#f0f0f0';
        ctx.beginPath();
        ctx.roundRect(10, 10, size - 20, size - 20, 30);
        ctx.fill();
        ctx.strokeStyle = '#aaa';
        ctx.lineWidth = 4;
        ctx.stroke();

        const shiftColor = SHIFT_TEXT_COLOR[shift] ?? '#000';

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = shiftColor;

        ctx.font = 'bold 90px "Kanit", "Arial", sans-serif';
        ctx.fillText(day, size / 2, 110);

        ctx.font = 'bold 100px "Kanit", "Arial", sans-serif';
        ctx.fillText(shift, size / 2, 190);

        ctx.shadowColor = 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;

        return canvasToTexture(canvas);
    }
}
