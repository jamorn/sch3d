/**
 * App — composition root รวมทุกส่วนเข้าด้วยกันและจัดการ lifecycle
 * ไม่มี DOM query / THREE detail ตรงๆ ที่นี่ (delegate ไปยังโมดูลย่อย)
 */
import * as THREE from 'three';

import { DEFAULT_CHARACTER_Z } from './config.js';
import { ShiftService } from './data/ShiftService.js';
import { AppState } from './data/AppState.js';
import { DeviceProfile } from './core/DeviceProfile.js';
import { SceneManager } from './core/SceneManager.js';
import { CalendarGrid } from './objects/CalendarGrid.js';
import { TeamLabels } from './objects/TeamLabels.js';
import { Arrow } from './objects/Arrow.js';
import { Character } from './objects/Character.js';
import { DayHeaderLabels } from './objects/DayHeaderLabels.js';
import { MonthLabel3D } from './objects/MonthLabel3D.js';
import { UiController } from './ui/UiController.js';
import { CharacterGui } from './ui/CharacterGui.js';
import { MonthGui } from './ui/MonthGui.js';
import { DayLabelGui } from './ui/DayLabelGui.js';
import { PickerController } from './interaction/PickerController.js';

export class App {
    constructor() {
        this.state = new AppState();
        this.shiftService = new ShiftService();
        this.deviceProfile = new DeviceProfile();

        // core
        this.sceneManager = new SceneManager(this.deviceProfile);

        // objects
        this.calendarGrid = new CalendarGrid(this.sceneManager.scene, this.shiftService);
        this.teamLabels = new TeamLabels(this.sceneManager.scene, this.calendarGrid);
        this.arrow = new Arrow(this.sceneManager.scene, this.calendarGrid);
        this.character = new Character(this.sceneManager.scene, this.calendarGrid);
        this.dayHeaderLabels = new DayHeaderLabels(this.sceneManager.scene, this.calendarGrid);
        this.monthLabel3D = new MonthLabel3D(this.sceneManager.scene);

        // ui
        this.ui = new UiController({
            onJump: (month, year, day) => this.jumpTo(month, year, day),
            onHome: () => this.goHome(),
        });

        // GUI (desktop เท่านั้น — ไม่สร้างเลยบน non-desktop เพื่อประหยัด resource)
        this.characterGui = null;
        this.monthGui = null;
        this.dayLabelGui = null;
        if (!this.deviceProfile.isCompactLayout) {
            this._buildGuis();
        }

        // interaction
        this.picker = new PickerController({
            sceneManager: this.sceneManager,
            calendarGrid: this.calendarGrid,
            deviceProfile: this.deviceProfile,
            onSelectDay: (day, month, year) => this.selectDate(year, month, day),
        });

        this._dayCameraOffset = new THREE.Vector3();
    }

    _buildGuis() {
        this.characterGui = new CharacterGui({
            defaultZ: DEFAULT_CHARACTER_Z,
            onChange: (z) => {
                this.character.setZ(z);
                this.character.moveToDate(this._focusDate());
            },
        });
        this.monthGui = new MonthGui({
            defaultZ: this.monthLabel3D.getZ(),
            onChange: (z) => this.monthLabel3D.setZ(z),
        });
        this.dayLabelGui = new DayLabelGui({
            defaultZ: this.dayHeaderLabels.getZ(),
            onChange: (z) => this.dayHeaderLabels.setZ(z),
        });
    }

    /**
     * เริ่มต้นแอป — focus ไปที่วันนี้ (home) แบบ zoom ทันที
     */
    init() {
        this.ui.populateMonthOptions();

        // ตัวละครอยู่ที่ตำแหน่ง Z เริ่มต้น (ทุก device)
        this.character.setZ(this.characterGui ? this.characterGui.value : DEFAULT_CHARACTER_Z);

        this.applyDeviceProfile();

        this._rebuildAround(this.state.year, this.state.month, this.state.day, { focus: true });

        this.ui.syncInputs(this.state.day, this.state.month, this.state.year);

        this._bindResize();
        this._startAnimation();
    }

    _focusDate() {
        return new Date(this.state.year, this.state.month, this.state.day);
    }

    /**
     * สร้าง grid + label ทั้งหมดรอบวันที่กำหนด (window ±RENDER_WINDOW = 7 วันเสมอ)
     */
    _rebuildAround(year, month, day, { focus = true } = {}) {
        this.state.setMonth(month, year);
        this.state.day = Math.min(Math.max(day, 1), this.state.daysInMonth);

        const focusDate = new Date(year, month, this.state.day);

        this.picker.resetHover();

        this.calendarGrid.build(year, month, this.state.day);
        this.dayHeaderLabels.build();
        this.monthLabel3D.update(this.calendarGrid, focusDate);

        this.teamLabels.update(focusDate);
        this.arrow.update(focusDate);
        this.character.moveToDate(focusDate);

        this.ui.updateMonthBadge(year, month);
        this.ui.updateFocusBadge(month, this.state.day);

        if (focus) {
            this._focusCameraOnDate(focusDate);
        }
    }

    // ---------- navigation ----------
    jumpTo(month, year, day) {
        this._rebuildAround(year, month, day, { focus: true });
        this.ui.syncInputs(this.state.day, month, year);
    }

    selectDate(year, month, day) {
        const inWindow = this.calendarGrid.getXForDate(new Date(year, month, day)) !== null;
        if (!inWindow) {
            this.jumpTo(month, year, day);
            return;
        }

        const date = new Date(year, month, day);
        this.state.day = day;

        this.teamLabels.update(date);
        this.arrow.update(date);
        this.character.moveToDate(date);
        this._focusCameraOnDate(date);
        this.ui.syncDay(day);
        this.ui.updateFocusBadge(month, day);
    }

    goHome() {
        const today = new Date();
        this.jumpTo(today.getMonth(), today.getFullYear(), today.getDate());
    }

    // ---------- camera ----------
    _focusCameraOnDate(date) {
        const targetX = this.calendarGrid.getXForDate(date);
        if (targetX === null) return;

        const focusPoint = new THREE.Vector3(targetX, 0.25, 0);
        this.sceneManager.focusAt(focusPoint, this._dayCameraOffset);
    }

    // ---------- device profile ----------
    applyDeviceProfile() {
        this.deviceProfile.refresh();
        this.deviceProfile.applyBodyClasses();
        this.sceneManager.applyProfile(this.deviceProfile);

        const offset = this.deviceProfile.dayCameraOffset;
        this._dayCameraOffset.set(offset.x, offset.y, offset.z);

        const compact = this.deviceProfile.isCompactLayout;

        // GUI — สร้างเฉพาะ desktop แล้ว, ซ่อนเมื่อ compact (เผื่อ resize)
        this.characterGui?.setVisible(compact);
        this.monthGui?.setVisible(compact);
        this.dayLabelGui?.setVisible(compact);

        // ซ่อนลูกศรแดงบน non-desktop
        this.arrow.setEnabled(!compact);

        this.sceneManager.setCursor(
            this.deviceProfile.hasHover ? (this.picker.hoveredBox ? 'pointer' : 'grab') : 'default',
        );

        this.ui.updateInfoText(this.deviceProfile);
    }

    // ---------- runtime ----------
    _bindResize() {
        window.addEventListener('resize', () => {
            this.applyDeviceProfile();
            this._focusCameraOnDate(this._focusDate());
        });
    }

    _startAnimation() {
        const loop = () => {
            requestAnimationFrame(loop);
            this.sceneManager.render();
        };
        loop();
    }
}
