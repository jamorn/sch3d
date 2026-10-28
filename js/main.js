/**
 * Entry point
 * สร้างและเริ่มต้นแอป
 */
import { App } from './App.js';

const app = new App();
app.init();

// เผื่อ debug บน console
window.__app = app;
