/**
 * AppState — เก็บ state กลางของแอป
 * พร้อมระบบ subscribe แบบง่าย (observer) สำหรับค่า currentDay
 */
import { getDaysInMonth } from '../utils/date.js';

export class AppState {
    /**
     * @param {object} [options]
     * @param {Date} [options.now] ใช้กำหนดวันเริ่มต้น (ค่า default = วันนี้)
     */
    constructor({ now = new Date() } = {}) {
        this.month = now.getMonth();
        this.year = now.getFullYear();
        this.day = now.getDate();
        this.daysInMonth = getDaysInMonth(this.year, this.month);
        this.startX = 0;

        this._dayListeners = new Set();
    }

    /**
     * เปลี่ยนไปเดือน/ปีที่กำหนด แล้วคำนวณ daysInMonth ใหม่
     * @param {number} month
     * @param {number} year
     */
    setMonth(month, year) {
        this.month = month;
        this.year = year;
        this.daysInMonth = getDaysInMonth(year, month);
    }

    /**
     * กำหนดวันที่ปัจจุบัน (clamp ให้อยู่ในช่วงของเดือน)
     * @param {number} day
     * @returns {boolean} true ถ้าค่าเปลี่ยน
     */
    setDay(day) {
        const clamped = Math.min(Math.max(day, 1), this.daysInMonth);
        if (clamped === this.day) return false;
        this.day = clamped;
        this._emitDay();
        return true;
    }

    /**
     * ตรวจว่าวันที่ระบุอยู่ในเดือนปัจจุบันหรือไม่
     * @param {number} day
     */
    isValidDay(day) {
        return Number.isInteger(day) && day >= 1 && day <= this.daysInMonth;
    }

    /**
     * ลงทะเบียน listener เมื่อ currentDay เปลี่ยน
     * @param {(day:number)=>void} cb
     * @returns {() => void} unsubscribe
     */
    onDayChange(cb) {
        this._dayListeners.add(cb);
        return () => this._dayListeners.delete(cb);
    }

    _emitDay() {
        for (const cb of this._dayListeners) cb(this.day);
    }
}
