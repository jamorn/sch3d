/**
 * ShiftService — คลาสคำนวณกะตามรอบ 8 วัน
 * เป็น pure logic (ไม่แตะ THREE/DOM) จึงเทสต์ได้ง่าย
 */
import { SHIFT_CYCLE, BASE_DATE } from '../config.js';
import { diffInDays } from '../utils/date.js';

export class ShiftService {
    /**
     * @param {string[]} [cycle] รอบกะ
     * @param {Date} [baseDate] วันอ้างอิง
     */
    constructor(cycle = SHIFT_CYCLE, baseDate = BASE_DATE) {
        this.cycle = cycle;
        this.cycleLength = cycle.length;
        this.baseDate = baseDate;
    }

    /**
     * คำนวณตัวอักษรกะ (M/E/N/O) ของทีม ในวันที่กำหนด
     * @param {number} teamOffset ค่า offset ของทีม
     * @param {Date} targetDate วันที่เป้าหมาย
     * @returns {string}
     */
    getShift(teamOffset, targetDate) {
        const diffDays = diffInDays(this.baseDate, targetDate);
        const raw = (diffDays + teamOffset) % this.cycleLength;
        const index = raw < 0 ? raw + this.cycleLength : raw;
        return this.cycle[index];
    }
}
