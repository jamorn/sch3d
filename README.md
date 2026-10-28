# 3D IRPC Shift Schedule

ตารางกะงาน (Shift Schedule) แบบ 3D Interactive สำหรับแสดงรอบการทำงานของ 4 ทีม (A–D)
ด้วย Three.js — ผู้ใช้สามารถหมุน/ซูมมุมมอง, เลือกวัน, และกระโดดไปดูวันใดก็ได้
เพื่อวางแผนการลา การไปพบแพทย์ หรือตรวจสอบรอบกะล่วงหน้า

---

## ✨ ฟีเจอร์หลัก

- **3D Calendar Grid** — แสดง 7 วันรอบวันโฟกัส (±3 วัน) เป็นกล่อง 3D
  โดยวันที่โฟกัสอยู่กึ่งกลางเสมอ
- **ข้ามเดือน/ข้ามปีอัตโนมัติ** — window ±3 วันดึงวันจริงจากเดือนก่อน/หลังมาเติมให้ครบ 7 วัน
  (เช่น focus = 1 NOV → แสดง 29, 30, 31 OCT + 1–4 NOV)
- **Short month box (มุมรอยต่อเดือน)** — เมื่ออยู่ที่รอยต่อเดือนจะเห็น 2 label
  (เช่น `OCT` + `NOV`) ติดกัน เพื่อบอกจุดเปลี่ยนเดือน
- **Day header labels** — ชื่อวันย่อ 3 ตัว (Mon, Tue, …) ลอยเหนือแต่ละคอลัมน์
- **Team labels A–D** — ป้ายวงกลม + เส้นชี้แบบแท่งท่อ + หัวลูกศร ชี้ไปยังวันของแต่ละทีม
  (แต่ละทีมใช้สีต่างกัน)
- **Humanoid character** — ตัวละคร 3D ยืนประจำวันที่โฟกัส (ปรับตำแหน่ง Z ได้)
- **Jump / Home controls** — เลือกเดือน/ปี/วัน แล้ว JUMP ไปได้ทันที, HOME กลับมาวันนี้
- **Responsive** — ปรับ layout + ซ่อน GUI/arrow/legend อัตโนมัติบนมือถือ/แท็บเล็ต
- **Shift cycle** — รอบกะ `M, M, E, E, N, N, O, O` (เช้า/บ่าย/ดึก/หยุด) ต่อทีมแบบ offset

---

## 🚀 วิธีรัน

โปรเจกต์นี้เป็น **static site** (Vanilla JS + ES modules) ไม่ต้อง build
แต่ต้องเสิร์ฟผ่าน HTTP server (เพราะใช้ ES modules + import map)

### ตัวเลือกที่ 1: VS Code Live Server
1. เปิดโฟลเดอร์โปรเจกต์ใน VS Code
2. ติดตั้ง extension **Live Server**
3. คลิกขวา `index.html` → **Open with Live Server**

### ตัวเลือกที่ 2: Python
```bash
python3 -m http.server 8000
```
แล้วเปิด `http://localhost:8000`

### ตัวเลือกที่ 3: Node (http-server)
```bash
npx http-server -p 8000
```

> ⚠️ ห้ามเปิด `index.html` แบบ `file://` ตรงๆ — จะโหลด ES modules ไม่ได้

---

## 🧱 Tech Stack

| ส่วน | เทคโนโลยี |
|---|---|
| 3D Rendering | [Three.js](https://threejs.org/) `v0.128.0` (ผ่าน esm.sh import map) |
| Debug GUI | [lil-gui](https://lil-gui.georgealways.com/) `v0.19` |
| โครงสร้าง | Vanilla JavaScript (ES Modules) |
| สไตล์ | CSS3 (responsive + media queries) |

dependency ทั้งหมดโหลดผ่าน **import map** ใน `index.html` — ไม่มี build step

---

## 📁 โครงสร้างโปรเจกต์

```
sch3d/
├── index.html                      # entry + import map + DOM
├── css/
│   └── styles.css                  # สไตล์ทั้งหมด (responsive)
└── js/
    ├── main.js                     # entry point — สร้าง App แล้ว init
    ├── App.js                      # composition root — wiring ทุกโมดูล
    ├── config.js                   # ค่าคงที่ทั้งหมด (single source of truth)
    ├── core/
    │   ├── DeviceProfile.js        # ตรวจจับอุปกรณ์ + ค่าปรับแต่งต่อ device
    │   └── SceneManager.js         # scene, camera, renderer, lights, OrbitControls
    ├── data/
    │   ├── AppState.js             # state (year/month/day) + validation
    │   └── ShiftService.js         # คำนวณกะจาก BASE_DATE + cycle
    ├── objects/
    │   ├── CalendarGrid.js         # กล่องวัน 7 วัน ±3 + texture เลขวัน/กะ
    │   ├── TeamLabels.js           # ป้าย A–D + เส้นท่อ + หัวลูกศร
    │   ├── Arrow.js                # ลูกศรแดงชี้วัน (ซ่อนบน non-desktop)
    │   ├── Character.js            # humanoid 3D
    │   ├── DayHeaderLabels.js      # ชื่อวัน Mon–Sun
    │   └── MonthLabel3D.js         # short month box (รอยต่อเดือน)
    ├── interaction/
    │   └── PickerController.js     # raycast เลือกวัน + hover
    ├── ui/
    │   ├── UiController.js         # info, month badge, jump controls
    │   ├── CharacterGui.js         # GUI ปรับ Z ตัวละคร (desktop)
    │   ├── MonthGui.js             # GUI ปรับ Z short month box (desktop)
    │   └── DayLabelGui.js          # GUI ปรับ Z day header labels (desktop)
    └── utils/
        ├── canvas.js               # ช่วยวาด canvas → THREE.Texture
        └── date.js                 # getDayWindow (±3 ข้ามเดือน/ปี), helpers
```

---

## 🎛️ การปรับแต่งตำแหน่ง (Desktop GUI)

บน desktop (ไม่ใช่ mobile/tablet) จะมี lil-gui 3 ตัว มุมขวาบน:

| GUI | ปรับ | ค่า default |
|---|---|---|
| **Character Position** | Z ของ humanoid | `DEFAULT_CHARACTER_Z = -5.25` |
| **Month Label Position** | Z ของ short month box | `MONTH_TEXT_Z = 5.8` |
| **Day Label (Mon-Sun) Position** | Z ของชื่อวัน | `DAY_LABEL_Z = -5.7` |

แต่ละ GUI มี slider + ช่อง readout (current Z) + ปุ่ม Reset
→ เลื่อนหาตำแหน่งที่ต้องการ แล้วนำค่าที่ได้ไปตั้งใน `js/config.js`

> GUI ทั้งหมดจะ **ไม่ถูกสร้างเลย** บน mobile/tablet (ประหยัด resource)

---

## ⚙️ ค่าคงที่สำคัญ (`js/config.js`)

```js
// ขนาดกล่องวัน
BOX = { width: 2.0, depth: 2.0, height: 0.5, gapX: 0.4, gapZ: 0.4 }

// จำนวนวัน ± รอบวันโฟกัส (3 → ทั้งหมด 7 วัน)
RENDER_WINDOW = 3

// รอบกะ
SHIFT_CYCLE = ['M', 'M', 'E', 'E', 'N', 'N', 'O', 'O']

// ทีม + offset
TEAMS = [
  { id: 'A', offset: 3 },
  { id: 'B', offset: 5 },
  { id: 'C', offset: 7 },
  { id: 'D', offset: 1 },
]

// สีประจำทีม
TEAM_COLORS = { A: 0x00cc88, B: 0x3b82f6, C: 0xf59e0b, D: 0xec4899 }
```

---

## 📱 Responsive Behavior

| อุปกรณ์ | พฤติกรรม |
|---|---|
| **Desktop** | แสดง GUI 3 ตัว, arrow, legend, month/focus badge เต็มรูปแบบ |
| **Tablet / Mobile** | ซ่อน GUI, ซ่อน arrow แดง, ซ่อน legend/badge; jump-controls เป็น floating panel มุมล่างซ้าย |

การตรวจจับอุปกรณ์ทำใน `js/core/DeviceProfile.js`
(width, touch points, pointer type) และใส่ class บน `<body>`
(`device-mobile` / `device-tablet` / `device-desktop`)

---

## 🔀 Git Branch

- `main` — branch หลัก
- `feature/calendar-3d-improvements` — งานปรับปรุง 3D calendar (branch ปัจจุบัน)

---

## 📝 License

Internal project — IRPC Shift Schedule.
