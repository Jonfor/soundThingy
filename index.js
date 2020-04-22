import * as THREE from "/node_modules/three/build/three.module.js";
import {PointerLockControls} from "/node_modules/three/examples/jsm/controls/PointerLockControls.js";

let camera, scene, renderer, controls;

const objects = [];

let raycaster;

let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let canJump = false;

let prevTime = performance.now();
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
const vertex = new THREE.Vector3();
const color = new THREE.Color();

init();
animate();

function init() {
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    1,
    1000
  );
  camera.position.y = 10;

  const listener = new THREE.AudioListener();
  camera.add(listener);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x5b5c5e);
  scene.fog = new THREE.Fog(0xffffff, 0, 750);

  const light = new THREE.HemisphereLight(0xeeeeff, 0x777788, 0.75);
  light.position.set(0.5, 1, 0.75);
  scene.add(light);

  controls = new PointerLockControls(camera, document.body);

  const blocker = document.getElementById("blocker");
  const instructions = document.getElementById("instructions");

  instructions.addEventListener(
    "click",
    function () {
      controls.lock();
    },
    false
  );

  controls.addEventListener("lock", function () {
    instructions.style.display = "none";
    blocker.style.display = "none";
  });

  controls.addEventListener("unlock", function () {
    blocker.style.display = "block";
    instructions.style.display = "";
  });

  scene.add(controls.getObject());

  const onKeyDown = function (event) {
    switch (event.key) {
      case "ArrowUp": // up
      case "w": // w
        moveForward = true;
        break;

      case "ArrowLeft": // left
      case "a": // a
        moveLeft = true;
        break;

      case "ArrowDown": // down
      case "s": // s
        moveBackward = true;
        break;

      case "ArrowRight": // right
      case "d": // d
        moveRight = true;
        break;

      case " ": // space
        if (canJump === true) velocity.y += 350;
        canJump = false;
        break;
    }
  };

  const onKeyUp = function (event) {
    switch (event.key) {
      case "ArrowUp": // up
      case "w": // w
        moveForward = false;
        break;

      case "ArrowLeft": // left
      case "a": // a
        moveLeft = false;
        break;

      case "ArrowDown": // down
      case "s": // s
        moveBackward = false;
        break;

      case "ArrowRight": // right
      case "d": // d
        moveRight = false;
        break;
    }
  };

  document.addEventListener("keydown", onKeyDown, false);
  document.addEventListener("keyup", onKeyUp, false);

  raycaster = new THREE.Raycaster(
    new THREE.Vector3(),
    new THREE.Vector3(0, -1, 0),
    0,
    10
  );

  // floor

  let floorGeometry = new THREE.PlaneBufferGeometry(2000, 2000, 100, 100);
  floorGeometry.rotateX(-Math.PI / 2);

  // vertex displacement

  let position = floorGeometry.attributes.position;

  for (let i = 0, l = position.count; i < l; i++) {
    vertex.fromBufferAttribute(position, i);

    vertex.x += Math.random() * 20 - 10;
    vertex.y += Math.random() * 2;
    vertex.z += Math.random() * 20 - 10;

    position.setXYZ(i, vertex.x, vertex.y, vertex.z);
  }

  floorGeometry = floorGeometry.toNonIndexed(); // ensure each face has unique vertices

  position = floorGeometry.attributes.position;
  let colors = [];

  for (let i = 0, l = position.count; i < l; i++) {
    color.setHSL(
      270 * Math.random(),
      0.75,
      0.45 * Math.random() + .4
    );
    colors.push(color.r, color.g, color.b);
  }

  floorGeometry.setAttribute(
    "color",
    new THREE.Float32BufferAttribute(colors, 3)
  );

  const floorMaterial = new THREE.MeshBasicMaterial({
    vertexColors: true
  });

  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  scene.add(floor);

  // objects

  const sound = new THREE.PositionalAudio(listener);

  const audioLoader = new THREE.AudioLoader();

  audioLoader.load('tunak.mp4', buffer => {
    sound.setBuffer(buffer);
    sound.setRefDistance(10);
    video.play();
    sound.play();
  });

  const video = document.getElementById( 'video' );

  const texture = new THREE.VideoTexture( video );
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.format = THREE.RGBFormat;

  // create an object for the sound to play from
  const theater = new THREE.BoxBufferGeometry( 50, 30, 0 );
  const material = new THREE.MeshPhongMaterial( { color: 0xff2200, map: texture } );
  const mesh = new THREE.Mesh( theater, material );
  scene.add( mesh );

// finally add the sound to the mesh
  mesh.add( sound );
  mesh.position.x = 0;
  mesh.position.y = 30;
  mesh.position.z = -100;

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  window.addEventListener("resize", onWindowResize, false);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);

  if (controls.isLocked === true) {
    raycaster.ray.origin.copy(controls.getObject().position);
    raycaster.ray.origin.y -= 10;

    const intersections = raycaster.intersectObjects(objects);

    const onObject = intersections.length > 0;

    const time = performance.now();
    const delta = (time - prevTime) / 1000;

    velocity.x -= velocity.x * 7.0 * delta;
    velocity.z -= velocity.z * 7.0 * delta;

    velocity.y -= 10 * 100.0 * delta; // 100.0 = mass

    direction.z = Number(moveForward) - Number(moveBackward);
    direction.x = Number(moveRight) - Number(moveLeft);
    direction.normalize(); // this ensures consistent movements in all directions

    if (moveForward || moveBackward)
      velocity.z -= direction.z * 400.0 * delta;
    if (moveLeft || moveRight) velocity.x -= direction.x * 400.0 * delta;

    if (onObject === true) {
      velocity.y = Math.max(0, velocity.y);
      canJump = true;
    }

    controls.moveRight(-velocity.x * delta);
    controls.moveForward(-velocity.z * delta);

    controls.getObject().position.y += velocity.y * delta; // new behavior

    if (controls.getObject().position.y < 10) {
      velocity.y = 0;
      controls.getObject().position.y = 10;

      canJump = true;
    }

    prevTime = time;
  }

  renderer.render(scene, camera);
}