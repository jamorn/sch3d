/**
 * ตัวช่วยเกี่ยวกับ Canvas 2D และการสร้าง THREE.CanvasTexture
 */
import * as THREE from 'three';

/**
 * polyfill roundRect (สำหรับ browser เก่าที่ยังไม่มี)
 * เรียกครั้งเดียวตอน import
 */
function installRoundRectPolyfill() {
    const proto = CanvasRenderingContext2D.prototype;
    if (typeof proto.roundRect === 'function') return;

    proto.roundRect = function roundRect(x, y, w, h, r) {
        if (w < 2 * r) r = w / 2;
        if (h < 2 * r) r = h / 2;
        this.moveTo(x + r, y);
        this.lineTo(x + w - r, y);
        this.quadraticCurveTo(x + w, y, x + w, y + r);
        this.lineTo(x + w, y + h - r);
        this.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        this.lineTo(x + r, y + h);
        this.quadraticCurveTo(x, y + h, x, y + h - r);
        this.lineTo(x, y + r);
        this.quadraticCurveTo(x, y, x + r, y);
        return this;
    };
}

installRoundRectPolyfill();

/**
 * สร้าง canvas เปล่าพร้อม context
 * @param {number} width
 * @param {number} height
 * @returns {{ canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D }}
 */
export function createCanvas(width, height = width) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return { canvas, ctx: canvas.getContext('2d') };
}

/**
 * แปลง canvas เป็น THREE texture
 * @param {HTMLCanvasElement} canvas
 * @returns {THREE.CanvasTexture}
 */
export function canvasToTexture(canvas) {
    return new THREE.CanvasTexture(canvas);
}
