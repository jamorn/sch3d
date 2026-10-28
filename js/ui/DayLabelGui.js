/**
 * DayLabelGui — lil-gui สำหรับปรับตำแหน่ง Z ของ label ชื่อวัน Mon-Sun (desktop เท่านั้น)
 * ใช้หาค่าที่ต้องการ แล้วนำค่าไปตั้งเป็น DAY_LABEL_Z ใน config
 */
import GUI from 'lil-gui';
import { DAY_LABEL_Z } from '../config.js';

export class DayLabelGui {
    /**
     * @param {object} options
     * @param {(z:number)=>void} options.onChange
     * @param {number} [options.defaultZ]
     */
    constructor({ onChange, defaultZ = DAY_LABEL_Z }) {
        this.onChange = onChange;
        this.defaultZ = defaultZ;
        this.state = { z: defaultZ };

        this.gui = new GUI({ title: 'Day Label (Mon-Sun) Position' });
        this.gui.domElement.style.position = 'absolute';
        this.gui.domElement.style.top = '350px';
        this.gui.domElement.style.right = '20px';
        this.gui.domElement.style.zIndex = '300';

        this._build();
    }

    _build() {
        this.zController = this.gui
            .add(this.state, 'z', -12, 12, 0.05)
            .name('Day Label Z')
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
