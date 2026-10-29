/**
 * UiController — จัดการ DOM: info text, month badge, jump controls
 * รับ callback จากภายนอก (onJump / onHome) เพื่อไม่ให้ผูกกับ logic 3D
 */
import { MONTH_NAMES, MONTH_SHORT_EN } from '../config.js';

export class UiController {
    /**
     * @param {object} handlers
     * @param {(month:number, year:number, day:number) => void} handlers.onJump
     * @param {() => void} handlers.onHome
     */
    constructor({ onJump, onHome }) {
        this.onJump = onJump;
        this.onHome = onHome;

        this.infoEl = document.getElementById('info');
        this.monthBadgeEl = document.getElementById('month-badge');
        this.jumpBtn = document.getElementById('jump-btn');
        this.homeBtn = document.getElementById('home-btn');
        this.dayInput = document.getElementById('jump-day');
        this.monthSelect = document.getElementById('jump-month');
        this.yearInput = document.getElementById('jump-year');

        this.focusMonthEl = document.getElementById('focus-month');
        this.focusDayEl = document.getElementById('focus-day');

        this._bindEvents();
    }

    _bindEvents() {
        this.jumpBtn.addEventListener('click', () => this._handleJump());
        this.homeBtn.addEventListener('click', () => {
            this.onHome?.();
        });

        // อัปเดต max ของช่องวันตามเดือน/ปี และ clamp ค่าที่เกิน
        this.monthSelect.addEventListener('change', () => this._syncDayMax());
        this.yearInput.addEventListener('input', () => this._syncDayMax());
        this.yearInput.addEventListener('change', () => this._syncDayMax());

        // บล็อก/clamp ค่าวันที่เกินตอนพิมพ์
        this.dayInput.addEventListener('input', () => this._clampDay());
        this.dayInput.addEventListener('change', () => this._clampDay());
    }

    /**
     * จำนวนวันสูงสุดของเดือน/ปีที่เลือกอยู่ (จาก input)
     * @returns {number}
     */
    _daysInSelectedMonth() {
        const month = parseInt(this.monthSelect.value, 10);
        let year = parseInt(this.yearInput.value, 10);
        if (Number.isNaN(year)) year = new Date().getFullYear();
        if (Number.isNaN(month)) return 31;
        return new Date(year, month + 1, 0).getDate();
    }

    /**
     * อัปเดต max attribute ของช่องวัน + clamp ค่าปัจจุบันให้อยู่ในช่วง
     */
    _syncDayMax() {
        const max = this._daysInSelectedMonth();
        this.dayInput.max = String(max);
        this._clampDay();
    }

    /**
     * clamp ค่าในช่องวันให้อยู่ใน 1..max (กันพิมพ์เกิน)
     */
    _clampDay() {
        const max = parseInt(this.dayInput.max, 10) || this._daysInSelectedMonth();
        let day = parseInt(this.dayInput.value, 10);

        // ปล่อยว่างไว้ระหว่างพิมพ์ (ให้ผู้ใช้พิมพ์ต่อได้)
        if (Number.isNaN(day)) return;

        if (day > max) {
            day = max;
            this.dayInput.value = String(max);
        } else if (day < 1) {
            day = 1;
            this.dayInput.value = '1';
        }
    }

    _handleJump() {
        // --- sanitize + validate อินพุตอย่างเข้มงวด ---
        const rawMonth = parseInt(this.monthSelect.value, 10);

        // ปี: ยอมรับเฉพาะตัวเลข ในช่วงที่กำหนด (input อาจว่าง/ตัวอักษร)
        let year = parseInt(this.yearInput.value, 10);
        const minYear = parseInt(this.yearInput.min, 10) || 2020;
        const maxYear = parseInt(this.yearInput.max, 10) || 2100;
        if (Number.isNaN(year)) {
            year = new Date().getFullYear();
            this.yearInput.value = year;
        }
        if (year < minYear || year > maxYear) {
            alert(`ปีต้องอยู่ระหว่าง ${minYear}–${maxYear}`);
            return;
        }

        // เดือน: 0-11
        if (Number.isNaN(rawMonth) || rawMonth < 0 || rawMonth > 11) {
            alert('กรุณาเลือกเดือน');
            return;
        }

        // วัน: clamp ให้อยู่ในช่วง 1..daysInMonth ของเดือน/ปีนั้นจริง
        const daysInMonth = new Date(year, rawMonth + 1, 0).getDate();
        let day = parseInt(this.dayInput.value, 10);
        if (Number.isNaN(day)) {
            alert(`กรุณากรอกวันที่ 1–${daysInMonth}`);
            return;
        }
        if (day > daysInMonth) {
            day = daysInMonth;
            this.dayInput.value = String(day);
        } else if (day < 1) {
            day = 1;
            this.dayInput.value = '1';
        }

        this.onJump?.(rawMonth, year, day);

        // feedback สี
        this.dayInput.style.backgroundColor = '#ffaa33';
        setTimeout(() => { this.dayInput.style.backgroundColor = ''; }, 200);
    }

    /**
     * อัปเดต legend ด้านบนตามอุปกรณ์
     * @param {import('../core/DeviceProfile.js').DeviceProfile} profile
     */
    updateInfoText(profile) {
        const day = new Date().getDate();
        const legend = profile.isCompactLayout
            ? 'M:เช้า E:บ่าย N:ดึก O:หยุด'
            : 'M:เช้า(เหลือง), E:บ่าย(ส้ม), N:ดึก(น้ำเงิน), O:หยุด(เทา)';
        const prefix = profile.isCompactLayout ? '📅 วันนี้' : '📅 วันที่ปัจจุบัน';
        this.infoEl.innerHTML = `${prefix} (${day}) สีทอง | ${legend}`;
    }

    /**
     * อัปเดต badge ชื่อเดือน/ปี
     * @param {number} year
     * @param {number} month
     */
    updateMonthBadge(year, month) {
        const text = new Date(year, month, 1).toLocaleDateString('th-TH', {
            month: 'long',
            year: 'numeric',
        });
        this.monthBadgeEl.innerText = text;
    }

    /**
     * sync ค่าใน input ให้ตรงกับ state
     * @param {number} day
     * @param {number} month
     * @param {number} year
     */
    syncInputs(day, month, year) {
        this.dayInput.value = day;
        this.monthSelect.value = month;
        this.yearInput.value = year;
        // อัปเดต max ของช่องวันตามเดือน/ปีใหม่
        this._syncDayMax();
    }

    /**
     * sync เฉพาะวันที่
     * @param {number} day
     */
    syncDay(day) {
        this.dayInput.value = day;
    }

    /**
     * อัปเดต focus badge (เดือน + วันที่ ที่กำลังโฟกัส)
     * @param {number} month
     * @param {number} day
     */
    updateFocusBadge(month, day) {
        if (this.focusMonthEl) {
            this.focusMonthEl.textContent = MONTH_SHORT_EN[month] ?? '';
        }
        if (this.focusDayEl) {
            this.focusDayEl.textContent = String(day);
        }
    }

    /**
     * ตั้งค่าเริ่มต้นของ dropdown เดือน (ถ้า HTML ยังว่าง)
     */
    populateMonthOptions() {
        if (this.monthSelect.options.length > 0) return;
        MONTH_NAMES.forEach((_, i) => {
            const opt = document.createElement('option');
            opt.value = String(i);
            opt.textContent = `${i + 1}`;
            this.monthSelect.appendChild(opt);
        });
    }
}
