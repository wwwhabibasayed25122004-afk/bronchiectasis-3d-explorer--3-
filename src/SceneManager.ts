import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export class SceneManager {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private airwayNode: THREE.Group;
  private particles: THREE.Points;
  private animationId: number | null = null;

  constructor(container: HTMLElement) {
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x0a0a0c, 0.1);

    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.z = 5;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x0a0a0c, 1);
    container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 0.5;

    this.airwayNode = new THREE.Group();
    this.particles = new THREE.Points();

    this.initLights();
    this.initObjects();
    this.animate();

    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  private initLights() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambientLight);

    const mainLight = new THREE.PointLight(0x4cc9f0, 2, 50);
    mainLight.position.set(5, 5, 5);
    this.scene.add(mainLight);

    const secondaryLight = new THREE.PointLight(0x7209b7, 1, 50);
    secondaryLight.position.set(-5, -5, 2);
    this.scene.add(secondaryLight);
  }

  private initObjects() {
    // Core Sphere
    const coreGeom = new THREE.SphereGeometry(1.5, 64, 64);
    const coreMat = new THREE.MeshPhongMaterial({
      color: 0x111111,
      emissive: 0x4cc9f0,
      emissiveIntensity: 0.1,
      shininess: 100,
      transparent: true,
      opacity: 0.9
    });
    const core = new THREE.Mesh(coreGeom, coreMat);
    this.airwayNode.add(core);

    // Wireframe Overlay
    const wireGeom = new THREE.SphereGeometry(1.52, 32, 32);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x4cc9f0,
      wireframe: true,
      transparent: true,
      opacity: 0.2
    });
    const wire = new THREE.Mesh(wireGeom, wireMat);
    this.airwayNode.add(wire);

    // Inner Pulsing Glow
    const glowGeom = new THREE.SphereGeometry(1.2, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x4cc9f0,
      transparent: true,
      opacity: 0.3
    });
    const glow = new THREE.Mesh(glowGeom, glowMat);
    glow.name = "glow";
    this.airwayNode.add(glow);

    // Floating Particles
    const pCount = 200;
    const pGeom = new THREE.BufferGeometry();
    const pPos = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount * 3; i++) {
      pPos[i] = (Math.random() - 0.5) * 6;
    }
    pGeom.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({
      color: 0x4cc9f0,
      size: 0.05,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });
    this.particles = new THREE.Points(pGeom, pMat);
    this.airwayNode.add(this.particles);

    this.scene.add(this.airwayNode);

    // Environment stars
    const starGeom = new THREE.BufferGeometry();
    const starVertices = [];
    for (let i = 0; i < 2000; i++) {
      starVertices.push(THREE.MathUtils.randFloatSpread(100));
      starVertices.push(THREE.MathUtils.randFloatSpread(100));
      starVertices.push(THREE.MathUtils.randFloatSpread(100));
    }
    starGeom.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    const starMat = new THREE.PointsMaterial({ color: 0x888888, size: 0.1 });
    const stars = new THREE.Points(starGeom, starMat);
    this.scene.add(stars);
  }

  private onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private animate() {
    this.animationId = requestAnimationFrame(this.animate.bind(this));

    const time = Date.now() * 0.001;

    const glow = this.airwayNode.getObjectByName("glow") as THREE.Mesh;
    if (glow) {
      glow.scale.setScalar(1 + Math.sin(time * 2) * 0.05);
      (glow.material as THREE.MeshBasicMaterial).opacity = 0.2 + Math.sin(time * 2) * 0.1;
    }

    this.particles.rotation.y += 0.002;
    this.particles.rotation.x += 0.001;

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  public dispose() {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }
    window.removeEventListener('resize', this.onWindowResize);
    this.renderer.dispose();
  }

  public resetCamera() {
    this.camera.position.set(0, 0, 5);
    this.controls.target.set(0, 0, 0);
  }

  public setAutoRotate(enabled: boolean) {
    this.controls.autoRotate = enabled;
  }
}
