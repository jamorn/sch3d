/**
 * ตัวช่วยจัดการวันที่แบบ pure function (ไม่ผูกกับ THREE หรือ DOM)
 */

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * จำนวนวันในเดือน (month: 0-11)
 * @param {number} year
 * @param {number} month
 * @returns {number}
 */
export function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
}

/**
 * ตัดเวลาออกให้เหลือแค่วันที่ (เที่ยงคืน) เพื่อคำนวณ diff วันได้แม่นยำ
 * @param {Date} date
 * @returns {Date}
 */
export function startOfDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * จำนวนวันระหว่างสองวันที่ (ปัดเศษให้เต็มวัน)
 * @param {Date} from
 * @param {Date} to
 * @returns {number}
 */
export function diffInDays(from, to) {
    return Math.round((startOfDay(to) - startOfDay(from)) / MS_PER_DAY);
}

/**
 * ตรวจสอบว่าวันที่ตรงกับ "วันนี้" หรือไม่
 * @param {number} year
 * @param {number} month
 * @param {number} day
 * @param {Date} [today]
 * @returns {boolean}
 */
export function isToday(year, month, day, today = new Date()) {
    return year === today.getFullYear()
        && month === today.getMonth()
        && day === today.getDate();
}

/**
 * แสดงชื่อเดือน + ปี ภาษาไทย
 * @param {number} year
 * @param {number} month
 * @returns {string}
 */
export function formatThaiMonthYear(year, month) {
    return new Date(year, month, 1).toLocaleDateString('th-TH', {
        month: 'long',
        year: 'numeric',
    });
}

/**
 * สร้างรายการวันที่ (actual Date) รอบ focus date ± radius
 * — ให้ 7 วันเสมอ และ focus อยู่ index กลาง (radius)
 * — ข้ามเดือน/ปีได้จริง (ดึงวันก่อน/หลังเดือนอื่นมาเติม)
 * @param {number} year
 * @param {number} month 0-11
 * @param {number} day
 * @param {number} radius
 * @returns {Date[]}
 */
export function getDayWindow(year, month, day, radius) {
    const focus = new Date(year, month, day);
    const dates = [];
    for (let offset = -radius; offset <= radius; offset++) {
        // ใช้ Date บวก/ลบวันจริง — จัดการข้ามเดือน/ปีให้อัตโนมัติ
        dates.push(new Date(focus.getFullYear(), focus.getMonth(), focus.getDate() + offset));
    }
    return dates;
}
