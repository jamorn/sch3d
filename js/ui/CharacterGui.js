/**
 * CharacterGui — lil-gui สำหรับปรับตำแหน่ง Z ของตัวละคร (desktop เท่านั้น)
 */
import GUI from 'lil-gui';
import { DEFAULT_CHARACTER_Z } from '../config.js';

export class CharacterGui {
    /**
     * @param {object} options
     * @param {(z:number)=>void} options.onChange
     * @param {number} [options.defaultZ]
     */
    constructor({ onChange, defaultZ = DEFAULT_CHARACTER_Z }) {
        this.onChange = onChange;
        this.defaultZ = defaultZ;
        this.state = { z: defaultZ };

        this.gui = new GUI({ title: 'Character Position' });
        this.gui.domElement.style.position = 'absolute';
        this.gui.domElement.style.top = '90px';
        this.gui.domElement.style.right = '20px';
        this.gui.domElement.style.zIndex = '300';

        this._build();
    }

    _build() {
        this.zController = this.gui
            .add(this.state, 'z', -10, 10, 0.05)
            .name('Character Z')
            .listen()
            .onChange((value) => this.onChange?.(value));

        this.gui
            .add({ resetZ: () => this.reset() }, 'resetZ')
            .name('Reset Z');
    }

    reset() {
        this.state.z = this.defaultZ;
        this.zController.updateDisplay();
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
