/**
 * DeviceProfile — ตรวจจับประเภทอุปกรณ์และให้ค่าปรับแต่งสำหรับแต่ละอุปกรณ์
 */

export class DeviceProfile {
    constructor() {
        this.refresh();
    }

    /**
     * อ่านสภาพแวดล้อมจริงแล้วอัปเดต field ภายใน
     */
    refresh() {
        const width = window.innerWidth;
        const hasTouchPoints = navigator.maxTouchPoints > 0;
        const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
        const hasHover = window.matchMedia('(hover: hover)').matches;
        const isIPad = /iPad/.test(navigator.userAgent)
            || (navigator.platform === 'MacIntel' && hasTouchPoints);

        this.isMobile = width <= 768;
        this.isTablet = !this.isMobile && (isIPad || (width <= 1180 && coarsePointer));
        this.isTouchDevice = hasTouchPoints || coarsePointer || isIPad || 'ontouchstart' in window;
        this.hasHover = hasHover && !coarsePointer;
        this.isCompactLayout = this.isMobile || this.isTablet;
    }

    /**
     * หมวดอุปกรณ์ (ใช้เทียบว่าหมวดเปลี่ยนหรือยัง)
     * @returns {'mobile'|'tablet'|'desktop'}
     */
    get category() {
        if (this.isMobile) return 'mobile';
        if (this.isTablet) return 'tablet';
        return 'desktop';
    }

    /**
     * pixel ratio ที่เหมาะสม
     * @returns {number}
     */
    get pixelRatioCap() {
        const base = window.devicePixelRatio || 1;
        if (this.isMobile) return Math.min(base, 1.35);
        if (this.isTablet) return Math.min(base, 1.6);
        return Math.min(base, 2);
    }

    /** @returns {number} */
    get fov() {
        if (this.isMobile) return 56;
        if (this.isTablet) return 50;
        return 45;
    }

    /** @returns {number} */
    get shadowMapSize() {
        if (this.isMobile) return 512;
        if (this.isTablet) return 768;
        return 1024;
    }

    /** @returns {boolean} */
    get enableShadows() {
        return !this.isMobile;
    }

    /**
     * ค่า offset กล้องเมื่อโฟกัสวัน (0, y, z)
     * @returns {{x:number, y:number, z:number}}
     */
    get dayCameraOffset() {
        if (this.isMobile) return { x: 0, y: 12, z: 18 };
        if (this.isTablet) return { x: 0, y: 11, z: 15.5 };
        return { x: 0, y: 10, z: 13 };
    }

    /** @returns {object} ค่าปรับแต่ง OrbitControls */
    get controlsSettings() {
        if (this.isMobile) {
            return {
                enablePan: false,
                zoomSpeed: 0.85,
                rotateSpeed: 0.72,
                panSpeed: 0.7,
                minDistance: 8.5,
                maxDistance: 72,
            };
        }
        if (this.isTablet) {
            return {
                enablePan: true,
                zoomSpeed: 0.95,
                rotateSpeed: 0.82,
                panSpeed: 0.8,
                minDistance: 7.5,
                maxDistance: 64,
            };
        }
        return {
            enablePan: true,
            zoomSpeed: 1.1,
            rotateSpeed: 1.0,
            panSpeed: 0.9,
            minDistance: 6,
            maxDistance: 60,
        };
    }

    /**
     * ใส่ class บน body เพื่อให้ CSS ปรับตามอุปกรณ์
     * @param {HTMLElement} [el]
     */
    applyBodyClasses(el = document.body) {
        el.classList.toggle('device-mobile', this.isMobile);
        el.classList.toggle('device-tablet', this.isTablet);
        el.classList.toggle('device-desktop', this.category === 'desktop');
        el.classList.toggle('touch-device', this.isTouchDevice);
    }
}
