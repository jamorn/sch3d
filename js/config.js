/**
 * ค่าคงที่ทั้งหมดของแอป (single source of truth)
 * แยกออกมาเพื่อให้โมดูลอื่น import ไปใช้ โดยไม่ต้อง hardcode ซ้ำ
 */

// ---------- ข้อมูลกะจากระบบจริง ----------
export const SHIFT_CYCLE = ['M', 'M', 'E', 'E', 'N', 'N', 'O', 'O'];

export const TEAMS = [
    { id: 'A', name: 'กะ A', offset: 3 },
    { id: 'B', name: 'กะ B', offset: 5 },
    { id: 'C', name: 'กะ C', offset: 7 },
    { id: 'D', name: 'กะ D', offset: 1 },
];

// 1 มกราคม 2026 (คงที่ตามระบบ)
export const BASE_DATE = new Date(2026, 0, 1);

// ---------- ขนาดกล่อง ----------
export const BOX = {
    width: 2.0,
    depth: 2.0,
    height: 0.5,
    gapX: 0.4,
    gapZ: 0.4,
};

// จำนวนวัน ± รอบวันโฟกัส ที่จะ render (ทุก device)
export const RENDER_WINDOW = 3;

// ---------- สี ----------
export const COLORS = {
    background: 0x111122,
    ground: 0x2a2a3a,
    gridCenter: 0xaaaaaa,
    gridLine: 0x444466,
    boxDefault: 0xc0c0c0,
    boxToday: 0xffaa33,
    emissiveToday: 0x442200,
    emissiveHover: 0x224466,
    arrow: 0xff3333,
    arrowCone: 0xff0000,
    arrowEmissive: 0x330000,
    teamLabel: '#00cc88',
    focusFrame: 0xffaa33,
};

// สีตัวอักษรกะบน texture
export const SHIFT_TEXT_COLOR = {
    M: '#b45309',
    E: '#c2410c',
    N: '#1e3a8a',
    O: '#4b5563',
};

// สีประจำทีม A–D (ใช้กับ label + เส้นชี้) — ต่างกันชัดเจน
export const TEAM_COLORS = {
    A: 0x00cc88, // เขียวมรกต
    B: 0x3b82f6, // ฟ้า
    C: 0xf59e0b, // ส้ม/เหลือง
    D: 0xec4899, // ชมพู/ม่วงแดง
};

// ตำแหน่ง Z ของตัวละคร (ทุก device)
export const DEFAULT_CHARACTER_Z = -5.25;
export const CHARACTER_BASE_Y = -0.22;

// ---------- Red Arrow (ลูกศรแดงด้านหลัง humanoid) ----------
export const ARROW = {
    // อยู่ด้านหลัง humanoid (camera อยู่ทาง +Z → ค่าลบกว่าคืออยู่หลัง)
    offsetZ: -1.8,
    // ระยะเวลาหมุนรอบตัวเอง 1 รอบ (วินาที)
    rotatePeriod: 6,
    // ความเร็วการขยับขึ้นลง (rad/s ของ sine)
    bobSpeed: 2.0,
    // Y ฐานของลูกศร (ก่อน bob) — ต่ำลงใกล้พื้น
    baseY: 0.6,
    // ระยะขยับขึ้นลง (หน่วย world) — bob ช่วง baseY ± amplitude
    bobAmplitude: 0.9,
    // ขนาดลูกศร (scale ทั้ง group)
    scale: 1.8,
};

// Y ของ label ชื่อวัน (Mon/Tue) บนหัว humanoid — เท่ากันทุกวัน
export const DAY_LABEL_Y = 2.6;
// Z ของ label ชื่อวัน (Mon/Tue) — ปรับได้ด้วย GUI
export const DAY_LABEL_Z = -5.7;

// ตำแหน่ง Z / Y ของ short month box (ด้านหลัง/ล่างของวัน, z บวก)
export const MONTH_TEXT_Z = 5.8;
// Y = ครึ่งความสูงกล่องเดือน (สูง 25% ของ BOX.height) ให้วางบนพื้นพอดี
export const MONTH_TEXT_Y = (0.5 * 0.25) / 2;

// ---------- Camera ----------
export const CAMERA = {
    // polar angle สูงสุด (rad) — ให้เงยได้ถึง top-view เอียง (78°)
    maxPolarAngle: (78 * Math.PI) / 180,
};

// ตัวอักษรย่อวัน (อังกฤษ 3 ตัว) index = Date.getDay() (0=Sun)
export const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ชื่อเดือนย่อภาษาอังกฤษ (ใช้ใน focus badge + 3D text)
export const MONTH_SHORT_EN = [
    'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
    'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
];

// ชื่อเดือนย่อภาษาไทย สำหรับ focus badge
export const MONTH_SHORT_TH = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
];

// ชื่อเดือนภาษาไทย
export const MONTH_NAMES = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];
