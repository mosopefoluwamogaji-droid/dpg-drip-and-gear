// Standout 3D hero visual: a slow-rotating ring of real product photos.
// Falls back silently to the existing static photo stack (already in the
// HTML) if the browser lacks WebGL, the visitor asked for reduced motion,
// or the viewport is small enough that a phone is probably budget/low-power
// and the data cost of loading Three.js + textures isn't worth it there.

function hasWebGLSupport() {
  try {
    const canvas = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (canvas.getContext("webgl") || canvas.getContext("experimental-webgl")));
  } catch (e) {
    return false;
  }
}

function init3DHero() {
  if (typeof THREE === "undefined") return; // three.js failed to load (e.g. offline) — keep the static fallback
  if (typeof prefersReducedMotion === "function" && prefersReducedMotion()) return;
  if (!hasWebGLSupport()) return;
  if (window.innerWidth < 560) return; // small/likely lower-power devices keep the lightweight static stack

  const mount = document.getElementById("hero-3d-mount");
  const stack = document.querySelector(".hero-stack");
  if (!mount) return;

  const images = [
    "assets/images/3d/watch-01.jpg",
    "assets/images/3d/sneaker-02.jpg",
    "assets/images/3d/polo-08.jpg",
    "assets/images/3d/pullover-01.jpg",
    "assets/images/3d/watch-04.jpg",
    "assets/images/3d/polo-19.jpg",
  ];

  const width = mount.clientWidth || 480;
  const height = mount.clientHeight || 320;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
  camera.position.set(0, 0.3, 7.2);

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  } catch (e) {
    return; // context creation failed — leave the static stack visible
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(width, height);
  mount.innerHTML = "";
  mount.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0xffffff, 0.95));
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.55);
  dirLight.position.set(2, 3, 4);
  scene.add(dirLight);

  const group = new THREE.Group();
  scene.add(group);

  const loader = new THREE.TextureLoader();
  const radius = 3.1;
  const planes = [];

  images.forEach((src, i) => {
    loader.load(
      src,
      (texture) => {
        const aspect = texture.image.width / texture.image.height;
        const planeH = 2.5;
        const planeW = planeH * aspect;
        const geometry = new THREE.PlaneGeometry(planeW, planeH);
        const material = new THREE.MeshStandardMaterial({ map: texture, side: THREE.DoubleSide, roughness: 0.75 });
        const mesh = new THREE.Mesh(geometry, material);
        const angle = (i / images.length) * Math.PI * 2;
        mesh.position.set(Math.sin(angle) * radius, 0, Math.cos(angle) * radius);
        mesh.lookAt(0, 0, 0);
        mesh.userData.phase = i * 1.1;
        group.add(mesh);
        planes.push(mesh);
      },
      undefined,
      () => {} // ignore individual texture load failures — the rest still render
    );
  });

  let targetTiltX = 0;
  mount.addEventListener("mousemove", (e) => {
    const rect = mount.getBoundingClientRect();
    targetTiltX = ((e.clientX - rect.left) / rect.width - 0.5) * 1.4;
  });
  mount.addEventListener("mouseleave", () => { targetTiltX = 0; });

  let running = true;
  document.addEventListener("visibilitychange", () => {
    running = document.visibilityState === "visible";
  });
  const io = new IntersectionObserver(
    (entries) => { entries.forEach((entry) => { running = entry.isIntersecting && document.visibilityState === "visible"; }); },
    { threshold: 0.1 }
  );
  io.observe(mount);

  let t = 0;
  let camX = 0;
  function animate() {
    requestAnimationFrame(animate);
    if (!running) return;
    t += 0.006;
    group.rotation.y = t;
    camX += (targetTiltX - camX) * 0.04;
    camera.position.x = camX;
    camera.lookAt(0, 0, 0);
    planes.forEach((p) => {
      p.position.y = Math.sin(t * 1.6 + p.userData.phase) * 0.1;
    });
    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener("resize", () => {
    const w = mount.clientWidth || width;
    const h = mount.clientHeight || height;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });

  if (stack) stack.style.display = "none";
  mount.style.display = "block";
}
