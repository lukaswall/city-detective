/* The Emerald Deva in 3D - a procedural gold-and-jade pendant (Three.js).
   mount(stage) returns true if WebGL took over, false to keep the still image. */
window.Amulet3D = (function () {
  'use strict';

  function mount(stage) {
    if (typeof THREE === 'undefined') return false;
    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch (e) { return false; }
    if (!renderer.getContext()) return false;

    var img = stage.querySelector('img');
    if (img) img.style.display = 'none';

    var W = stage.clientWidth || 320, H = stage.clientHeight || 380;
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    stage.appendChild(renderer.domElement);

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(32, W / H, 0.1, 100);
    camera.position.set(0, 0.1, 6.2);

    // lighting: warm key, cool rim, jade bounce from below
    scene.add(new THREE.AmbientLight(0x2a2620, 1.1));
    var key = new THREE.DirectionalLight(0xffe3b0, 1.6);
    key.position.set(3, 4, 5);
    scene.add(key);
    var rim = new THREE.DirectionalLight(0x6fb6ff, 0.7);
    rim.position.set(-4, 2, -3);
    scene.add(rim);
    var glow = new THREE.PointLight(0x35b08a, 1.2, 12);
    glow.position.set(0, -1.6, 2.2);
    scene.add(glow);

    var pendant = new THREE.Group();

    // teardrop profile for the gold frame, spun around Y
    var pts = [];
    for (var i = 0; i <= 40; i++) {
      var t = i / 40;                       // 0 bottom tip -> 1 top
      var a = t * Math.PI;
      var r = Math.sin(a) * (0.62 + 0.5 * t); // wider toward the top
      var y = -1.15 + t * 2.1;
      pts.push(new THREE.Vector2(Math.max(r * 0.16, 0.001), y));
    }
    var frame = new THREE.Mesh(
      new THREE.LatheGeometry(pts, 48),
      new THREE.MeshStandardMaterial({ color: 0xc9a24b, metalness: 0.95, roughness: 0.28, side: THREE.DoubleSide })
    );
    pendant.add(frame);

    // the stone: a teardrop gem, slightly inset
    var gem = new THREE.Mesh(
      new THREE.SphereGeometry(0.62, 40, 32),
      new THREE.MeshStandardMaterial({
        color: 0x0f8f66, metalness: 0.1, roughness: 0.12,
        emissive: 0x063d2c, emissiveIntensity: 0.55
      })
    );
    gem.scale.set(0.78, 1.28, 0.5);
    gem.position.y = -0.28;
    pendant.add(gem);

    // bail ring on top
    var bail = new THREE.Mesh(
      new THREE.TorusGeometry(0.22, 0.055, 16, 40),
      frame.material
    );
    bail.position.y = 1.12;
    pendant.add(bail);

    pendant.rotation.x = 0.06;
    scene.add(pendant);

    var targetRX = 0.06, targetRY = 0;
    stage.addEventListener('pointermove', function (e) {
      var r = stage.getBoundingClientRect();
      var dx = (e.clientX - r.left) / r.width - 0.5;
      var dy = (e.clientY - r.top) / r.height - 0.5;
      targetRY = dx * 0.9;
      targetRX = 0.06 + dy * 0.5;
    });
    stage.addEventListener('pointerleave', function () { targetRX = 0.06; targetRY = 0; });

    var t0 = performance.now();
    var running = true;
    function frameLoop(now) {
      if (!running) return;
      var t = (now - t0) / 1000;
      pendant.rotation.y += ((targetRY + t * 0.25) - pendant.rotation.y) * 0.04;
      pendant.rotation.x += (targetRX - pendant.rotation.x) * 0.06;
      pendant.position.y = Math.sin(t * 0.9) * 0.08;
      glow.intensity = 1.1 + Math.sin(t * 1.7) * 0.25;
      renderer.render(scene, camera);
      requestAnimationFrame(frameLoop);
    }
    requestAnimationFrame(frameLoop);

    window.addEventListener('resize', function () {
      var w = stage.clientWidth, h = stage.clientHeight;
      if (!w || !h) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });

    return true;
  }

  return { mount: mount };
})();
