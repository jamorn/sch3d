/**
 * TeamLabels — ป้ายชื่อทีม (วงกลม A/B/C/D) + เส้นชี้แบบแท่งท่อ + หัวลูกศร
 * แต่ละทีมใช้สีต่างกันเพื่อความชัดเจน
 */
import * as THREE from 'three';
import { BOX, TEAMS, TEAM_COLORS } from '../config.js';
import { createCanvas, canvasToTexture } from '../utils/canvas.js';

export class TeamLabels {
    /**
     * @param {THREE.Scene} scene
     * @param {import('./CalendarGrid.js').CalendarGrid} calendarGrid
     */
    constructor(scene, calendarGrid) {
        this.scene = scene;
        this.calendarGrid = calendarGrid;
        this.group = new THREE.Group();
        scene.add(this.group);
    }

    clear() {
        while (this.group.children.length) {
            const child = this.group.children[0];
            this.group.remove(child);
            this._dispose(child);
        }
    }

    _dispose(obj) {
        obj.traverse((child) => {
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
     * อัปเดตป้ายให้ตรงกับวันที่เลือก
     * @param {Date} targetDate
     */
    update(targetDate) {
        this.clear();
        if (!targetDate) return;

        const targetX = this.calendarGrid.getXForDate(targetDate);
        if (targetX === null) return;

        for (let t = 0; t < TEAMS.length; t++) {
            const targetPos = new THREE.Vector3(
                targetX,
                BOX.height / 2,
                this.calendarGrid.getZForTeam(t),
            );
            const offset = new THREE.Vector3(-2.8, 2.0 + t * 0.3, 0);
            const color = TEAM_COLORS[TEAMS[t].id] ?? 0xffffff;
            this.group.add(this._createLabel(TEAMS[t].id, targetPos, offset, color));
        }
    }

    _createLabel(teamName, targetPos, offset, color) {
        const group = new THREE.Group();
        const labelPos = targetPos.clone().add(offset);

        // --- เส้นชี้แบบแท่งท่อ + หัวลูกศร ---
        // ให้หัวลูกศรอยู่ใกล้กล่อง (ปลายด้าน targetPos)
        const dir = labelPos.clone().sub(targetPos).normalize();
        const headLength = 0.55;
        const headRadius = 0.16;
        // จุดที่หัวลูกศรเริ่ม (ถอยจาก targetPos ตามแนว dir)
        const shaftEnd = targetPos.clone().add(dir.clone().multiplyScalar(headLength));

        const mat = new THREE.MeshStandardMaterial({
            color,
            emissive: color,
            emissiveIntensity: 0.35,
            roughness: 0.35,
            metalness: 0.2,
        });

        // 1) แท่งท่อ (จากป้ายไปถึงจุดเริ่มหัวลูกศร)
        const shaftVec = shaftEnd.clone().sub(labelPos);
        const shaftLen = shaftVec.length();
        if (shaftLen > 0.001) {
            const shaftGeo = new THREE.CylinderGeometry(0.05, 0.05, shaftLen, 10);
            const shaft = new THREE.Mesh(shaftGeo, mat);
            // วางให้กลางอยู่ระหว่าง labelPos กับ shaftEnd แล้วหมุนให้ชี้ตามแนว
            const mid = labelPos.clone().add(shaftEnd).multiplyScalar(0.5);
            shaft.position.copy(mid);
            shaft.quaternion.setFromUnitVectors(
                new THREE.Vector3(0, 1, 0),
                shaftVec.clone().normalize(),
            );
            shaft.castShadow = true;
            group.add(shaft);
        }

        // 2) หัวลูกศร (ชี้เข้าที่กล่อง = ปลายที่ targetPos)
        const coneGeo = new THREE.ConeGeometry(headRadius, headLength, 14);
        const cone = new THREE.Mesh(coneGeo, mat);
        // cone ชี้ไปทาง +Y ตามดีฟอลต์; ต้องชี้ไปทาง dir (จากป้าย -> กล่อง)
        cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
        // ตำแหน่งกลางหัวลูกศร
        const coneCenter = targetPos.clone().add(dir.clone().multiplyScalar(-headLength / 2));
        cone.position.copy(coneCenter);
        cone.castShadow = true;
        group.add(cone);

        // --- วงกลมชื่อทีม (sprite) ---
        const { canvas, ctx } = createCanvas(128);
        const cssColor = `#${color.toString(16).padStart(6, '0')}`;
        ctx.beginPath();
        ctx.arc(64, 64, 50, 0, 2 * Math.PI);
        ctx.fillStyle = cssColor;
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 6;
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 74px "Kanit", "Arial", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0,0,0,0.4)';
        ctx.shadowBlur = 6;
        ctx.fillText(teamName, 64, 64);

        const spriteMat = new THREE.SpriteMaterial({
            map: canvasToTexture(canvas),
            depthTest: false,
            transparent: true,
        });
        const sprite = new THREE.Sprite(spriteMat);
        sprite.position.copy(labelPos);
        sprite.scale.set(1.4, 1.4, 0.2);
        sprite.renderOrder = 1000;
        group.add(sprite);

        return group;
    }
}
