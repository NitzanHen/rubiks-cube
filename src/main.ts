import * as THREE from 'three';
import { Clock, Color, Mesh, Quaternion, Vector3 } from 'three';
import { makeArray, tuple } from 'rhax';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Axis, generatePermutations, randomInt, randomIntExcluding, round, Sign, sleep } from './utils';
import './style.css';

const { PI, pow } = Math;


const canvas = document.querySelector('canvas')!;

const n = 3;

const positions = [...generatePermutations(
  ...makeArray(3, () => makeArray(n, i => i - (n - 1) / 2))
)];


const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new Color("#222222");

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 10000);

const controls = new OrbitControls(camera, renderer.domElement);

// const axesHelper = new THREE.AxesHelper(5);
// scene.add(axesHelper);

const cubes: THREE.Mesh[] = [];

for (const pos of positions) {
  const piece = new THREE.BoxGeometry(0.95, 0.95, 0.95).toNonIndexed();

  const material = new THREE.MeshBasicMaterial({
    vertexColors: true
  });

  const colors = [];
  const faceColors = ['blue', 'green', 'yellow', 'orange', 'red', 'white']
  // These are the directions in which three.js paints the faces, in order.
  const directions = [
    new Vector3(1, 0, 0), new Vector3(-1, 0, 0),
    new Vector3(0, 1, 0), new Vector3(0, -1, 0),
    new Vector3(0, 0, 1), new Vector3(0, 0, -1),
  ];

  for (let j = 0; j < 6; j++) {

    const position = new Vector3(pos[0], pos[1], pos[2]);

    const direction = directions[j];
    const facingOutwards = position.clone().add(direction).length() > position.clone().sub(direction).length();

    const color = facingOutwards ? new Color(faceColors[j]) : scene.background.clone();

    for (let k = 0; k < 6; k++) {
      colors.push(color.r, color.g, color.b);
    }
  }

  piece.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  const cube = new THREE.Mesh(piece, material);
  cube.position.set(pos[0], pos[1], pos[2]);

  cubes.push(cube);
  scene.add(cube);
}


//controls.update() must be called after any manual changes to the camera's transform
camera.position.set(10, 7, 10);
controls.update();

function animate() {
  requestAnimationFrame(animate);

  // required if controls.enableDamping or controls.autoRotate are set to true
  controls.update();
  renderer.render(scene, camera);
}
animate();

const fixCubeCoords = (cubes: Mesh[]) => cubes.forEach((cube) => {
  const { x, y, z } = cube.position;
  cube.position.set(round(x, 3), round(y, 3), round(z, 3))
})

async function rotate(axis: Axis, sign: Sign, clockwise: boolean, duration = 400) {
  return new Promise<void>((resolve) => {

    const direction = new Vector3();
    direction[axis] = sign * (n - 1) / 2;

    const faceCubes = cubes.filter(cube => cube.position[axis] === direction[axis]);

    const cubeOriginalPositions = faceCubes.map(c => c.position.clone());
    const cubeOriginalQuaternions = faceCubes.map(c => c.quaternion.clone());

    function easeInOutCubic(t: number): number {
      return t < 0.5 ? 4 * pow(t, 3) : 1 - pow(-2 * t + 2, 3) / 2;
    }

    const clock = new Clock();
    const handleVisibilityChange = () => {
      console.log(document.visibilityState)
      document.visibilityState === 'hidden' ? clock.stop() : clock.start();
    }
    addEventListener('visibilitychange', handleVisibilityChange);

    const tick = () => {

      const elapsed = clock.getElapsedTime() * 1000 // convert to ms

      if (elapsed > duration) {
        // Positions might be almost integers, round them so filtering by coordinate works.
        fixCubeCoords(cubes);
        clock.stop();
        removeEventListener('visibilityChange', handleVisibilityChange);
        return resolve();
      }

      requestAnimationFrame(tick);

      const t = easeInOutCubic(elapsed / duration);


      const angle = (clockwise ? -1 : 1) * (PI / 2) * t;

      for (let i = 0; i < faceCubes.length; i++) {
        const cube = faceCubes[i];
        const originalPos = cubeOriginalPositions[i];
        const originalQuat = cubeOriginalQuaternions[i];

        cube.quaternion.copy(originalQuat.clone().premultiply(new Quaternion().setFromAxisAngle(direction, angle)));
        cube.position.copy(originalPos.clone().applyAxisAngle(direction, angle));
      }
    }

    clock.start();
    tick();
  });
}

let shuffling = false;
/** @todo typing */
const rotations = [...generatePermutations<any>(
  tuple('x', 'y', 'z'),
  tuple(1, -1),
  tuple(true, false)
)] as [Axis, Sign, boolean][];
let lastRotation: [Axis, Sign, boolean] | null = null;
let rotationIndex: number;

const shuffle = async (shuffles: number) => {
  if (shuffling) {
    return;
  }

  shuffling = true;

  rotationIndex = randomInt(0, rotations.length);
  lastRotation = rotations[rotationIndex];

  for (let i = 0; i < shuffles; i++) {
    const [lastAxis, lastSign, lastClockwise] = lastRotation;
    const inverseIndex = rotations.findIndex(([a, s, c]) => a === lastAxis && s === lastSign && c === !lastClockwise);

    rotationIndex = randomIntExcluding(0, rotations.length, inverseIndex);
    const rotation = rotations[rotationIndex];
    const [axis, sign, clockwise] = rotation;

    await rotate(axis, sign, clockwise, 400);
    await sleep(200);

    lastRotation = rotation;
  }

  shuffling = false;
}

shuffle(30)

// rotate('x', 1, true)
//   .then(() => sleep(1000))
//   .then(() => rotate('y', 1, true))
//   .then(() => sleep(1000))
//   .then(() => rotate('y', 1, false))
//   .then(() => sleep(1000))
//   .then(() => rotate('y', 1, true))