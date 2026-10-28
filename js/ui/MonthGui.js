/**
 * MonthGui — lil-gui สำหรับปรับตำแหน่ง Z ของ short month box (desktop เท่านั้น)
 * ใช้หาค่าที่ต้องการ แล้วนำค่าไปตั้งเป็น MONTH_TEXT_Z ใน config
 */
import GUI from 'lil-gui';
import { MONTH_TEXT_Z } from '../config.js';

export class MonthGui {
    /**
     * @param {object} options
     * @param {(z:number)=>void} options.onChange
     * @param {number} [options.defaultZ]
     */
    constructor({ onChange, defaultZ = MONTH_TEXT_Z }) {
        this.onChange = onChange;
        this.defaultZ = defaultZ;
        this.state = { z: defaultZ };

        this.gui = new GUI({ title: 'Month Label Position' });
        this.gui.domElement.style.position = 'absolute';
        this.gui.domElement.style.top = '220px';
        this.gui.domElement.style.right = '20px';
        this.gui.domElement.style.zIndex = '300';

        this._build();
    }

    _build() {
        this.zController = this.gui
            .add(this.state, 'z', -10, 12, 0.05)
            .name('Month Z')
            .listen()
            .onChange((value) => this.onChange?.(value));

        // แสดงค่าปัจจุบันให้อ่านง่าย (ไว้บอก AI)
        this.readout = this.gui
            .add(this.state, 'z')
            .name('current Z')
            .listen()
            .disable();

        this.gui
            .add({ resetZ: () => this.reset() }, 'resetZ')
            .name('Reset Z');
    }

    reset() {
        this.state.z = this.defaultZ;
        this.zController.updateDisplay();
        this.readout.updateDisplay();
        this.onChange?.(this.state.z);
    }

    /**
     * @returns {number}
     */
    get value() {
        return this.state.z;
    }

    /**
     * ซ่อน/แสดง gui ตามอุปกรณ์
     * @param {boolean} compact
     */
    setVisible(compact) {
        this.gui.domElement.style.display = compact ? 'none' : '';
    }
}
