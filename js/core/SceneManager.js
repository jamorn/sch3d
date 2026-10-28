/**
 * SceneManager — ครอบ scene / camera / renderer / lights / ground / controls
 * และรับผิดชอบการ resize + การปรับค่าตาม DeviceProfile
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { COLORS, CAMERA } from '../config.js';

export class SceneManager {
    /**
     * @param {import('./DeviceProfile.js').DeviceProfile} deviceProfile
     */
    constructor(deviceProfile) {
        this.deviceProfile = deviceProfile;
        this.isOrbiting = false;

        this._createScene();
        this._createCamera();
        this._createRenderer();
        this._createControls();
        this._createLights();
        this._createGround();
        this._bindControlsEvents();
    }

    _createScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(COLORS.background);
    }

    _createCamera() {
        this.camera = new THREE.PerspectiveCamera(
            45,
            window.innerWidth / window.innerHeight,
            0.1,
            1000,
        );
        this.camera.position.set(0, 20, 25);
        this.camera.lookAt(0, 0, 0);
    }

    _createRenderer() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        this.renderer.domElement.style.touchAction = 'none';
        this.renderer.domElement.style.cursor = 'grab';
        document.body.appendChild(this.renderer.domElement);
    }

    _createControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.screenSpacePanning = true;
        this.controls.enablePan = true;
        this.controls.enableZoom = true;
        this.controls.zoomSpeed = 1.1;
        this.controls.rotateSpeed = 1.0;
        this.controls.panSpeed = 0.9;
        this.controls.minDistance = 6;
        this.controls.maxDistance = 60;
        this.controls.maxPolarAngle = CAMERA.maxPolarAngle;
        this.controls.target.set(0, 0, 0);
        this.controls.update();
    }

    _createLights() {
        this.ambientLight = new THREE.AmbientLight(0x404060);
        this.scene.add(this.ambientLight);

        const dir = new THREE.DirectionalLight(0xffffff, 1);
        dir.position.set(5, 20, 10);
        dir.castShadow = true;
        dir.receiveShadow = true;
        dir.shadow.mapSize.width = 1024;
        dir.shadow.mapSize.height = 1024;
        const d = 30;
        dir.shadow.camera.left = -d;
        dir.shadow.camera.right = d;
        dir.shadow.camera.top = d;
        dir.shadow.camera.bottom = -d;
        dir.shadow.camera.near = 1;
        dir.shadow.camera.far = 50;
        this.dirLight = dir;
        this.scene.add(dir);

        const back = new THREE.PointLight(0x4466cc, 0.5);
        back.position.set(-5, 10, -10);
        this.backLight = back;
        this.scene.add(back);
    }

    _createGround() {
        const groundGeo = new THREE.PlaneGeometry(100, 100);
        const groundMat = new THREE.MeshStandardMaterial({
            color: COLORS.ground,
            roughness: 0.8,
            metalness: 0.2,
        });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.3;
        ground.receiveShadow = true;
        this.scene.add(ground);

        const grid = new THREE.GridHelper(80, 40, COLORS.gridCenter, COLORS.gridLine);
        grid.position.y = -0.25;
        this.scene.add(grid);
    }

    _bindControlsEvents() {
        this.controls.addEventListener('start', () => {
            this.isOrbiting = true;
        });
        this.controls.addEventListener('end', () => {
            this.isOrbiting = false;
        });
    }

    /**
     * ปรับค่า renderer/camera/controls ตาม Profile
     * @param {import('./DeviceProfile.js').DeviceProfile} [profile]
     */
    applyProfile(profile = this.deviceProfile) {
        const p = profile;
        const c = p.controlsSettings;

        this.renderer.setPixelRatio(p.pixelRatioCap);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = p.enableShadows;

        this.dirLight.castShadow = p.enableShadows;
        this.dirLight.shadow.mapSize.width = p.shadowMapSize;
        this.dirLight.shadow.mapSize.height = p.shadowMapSize;
        if (this.dirLight.shadow.map) this.dirLight.shadow.map.dispose();

        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.fov = p.fov;
        this.camera.updateProjectionMatrix();

        this.controls.enablePan = c.enablePan;
        this.controls.zoomSpeed = c.zoomSpeed;
        this.controls.rotateSpeed = c.rotateSpeed;
        this.controls.panSpeed = c.panSpeed;
        this.controls.minDistance = c.minDistance;
        this.controls.maxDistance = c.maxDistance;
    }

    /**
     * เลื่อนกล้องไปยังจุดโฟกัส โดยคงมุมมอง (offset) เดิมไว้
     * @param {THREE.Vector3} focusPoint
     * @param {THREE.Vector3} offset
     */
    focusAt(focusPoint, offset) {
        this.camera.position.copy(focusPoint.clone().add(offset));
        this.controls.target.copy(focusPoint);
        this.controls.update();
    }

    /**
     * ตั้ง cursor ของ canvas
     * @param {string} cursor
     */
    setCursor(cursor) {
        this.renderer.domElement.style.cursor = cursor;
    }

    render() {
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}
