import * as THREE from 'three';
import { Color, Quaternion, Vector3 } from 'three';
import { makeArray, map, zip } from 'rhax';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { generatePermutations, infinityNorm, randomInt, randomIntExcluding, sleep } from './utils';
import anime from 'animejs';
import './style.css';
import { Vec3 } from './types';
import { Cube } from './Cube';
import { Rotation, rotations } from './Rotation';

const { PI } = Math;

const canvas = document.querySelector('canvas')!;

const n = 3;

const positions = [...generatePermutations(
  ...makeArray(3, () => makeArray(n))
)] as Vec3[];

const cubeCoords = positions.map((pos: Vec3) => pos.map(i => i - (n - 1) / 2) as Vec3);

const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new Color("#222222");

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 10000);

const controls = new OrbitControls(camera, renderer.domElement);

// const axesHelper = new THREE.AxesHelper(5);
// scene.add(axesHelper);

const cubes: Cube[] = [];

for (const coords of cubeCoords) {
  const piece = new THREE.BoxGeometry(0.92, 0.92, 0.92).toNonIndexed();

  const material = new THREE.MeshBasicMaterial({
    vertexColors: true
  });

  const colors = [];
  const faceColors = ['blue', 'green', 'yellow', 'orange', 'red', 'white']
  // These are the directions in which three.js paints the faces, in order.
  const directions = [
    [1, 0, 0], [-1, 0, 0],
    [0, 1, 0], [0, -1, 0],
    [0, 0, 1], [0, 0, -1],
  ];

  for (let j = 0; j < 6; j++) {
    const direction = directions[j];

    const sum = map(zip(coords, direction), ([a, b]) => a + b)

    const facingOutwards = infinityNorm(sum) === (n + 1) / 2;

    const color = facingOutwards ? new Color(faceColors[j]) : scene.background.clone();

    for (let k = 0; k < 6; k++) {
      colors.push(color.r, color.g, color.b);
    }
  }

  piece.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

  const mesh = new THREE.Mesh(piece, material);
  mesh.position.fromArray(coords);

  cubes.push(new Cube(mesh, coords));
  scene.add(mesh);
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

const fixMeshCoords = (cubes: Cube[]) => cubes.forEach(({ mesh, coords }) => mesh.position.fromArray(coords))

async function rotate(rotation: Rotation, duration: number) {
  return new Promise<void>((resolve) => {
    const { axis, sign, clockwise } = rotation;

    // Normal vector to the face on which the rotation operates
    const normal = new Vector3();
    normal[axis] = sign;

    const faceCubes = cubes.filter((cube) => cube.mesh.position[axis] === sign * (n - 1) / 2);

    const cubeOriginalPositions = faceCubes.map(({ mesh }) => mesh.position.clone());
    const cubeOriginalQuaternions = faceCubes.map(({ mesh }) => mesh.quaternion.clone());

    const timer = { t: 0 };

    const tick = (t: number) => {
      const angle = (clockwise ? -1 : 1) * (PI / 2) * t;

      for (let i = 0; i < faceCubes.length; i++) {
        const { mesh } = faceCubes[i];
        const originalPos = cubeOriginalPositions[i];
        const originalQuat = cubeOriginalQuaternions[i];

        mesh.quaternion.copy(originalQuat.clone().premultiply(new Quaternion().setFromAxisAngle(normal, angle)));
        mesh.position.copy(originalPos.clone().applyAxisAngle(normal, angle));
      }
    }

    const animation = anime({
      targets: timer,
      t: 1,
      duration,
      easing: 'easeInOutCubic',
      autoplay: false,
      update() {
        tick(timer.t);
      },
      complete() {
        Rotation.apply(faceCubes, rotation);
        fixMeshCoords(cubes);

        //removeEventListener('visibilityChange', handleVisibilityChange);

        console.log('finished')

        resolve();
      }
    });

    // const handleVisibilityChange = () => {
    //   document.visibilityState === 'hidden' ? animation.pause() : animation.play();
    // }
    // addEventListener('visibilitychange', handleVisibilityChange);

    animation.play();
  });
}

let shuffling = false;

let lastRotation: Rotation;;
let rotationIndex: number;

const shuffle = async (shuffles: number) => {
  if (shuffling) {
    return;
  }

  shuffling = true;

  rotationIndex = randomInt(0, rotations.length);
  lastRotation = rotations[rotationIndex];

  for (let i = 0; i < shuffles; i++) {
    const inverseIndex = rotations.findIndex(r => Rotation.equal(r, Rotation.inverse(lastRotation)));

    rotationIndex = randomIntExcluding(0, rotations.length, inverseIndex);
    const rotation = rotations[rotationIndex];

    await rotate(rotation, 300);
    await sleep(60);

    lastRotation = rotation;
  }

  shuffling = false;
}

shuffle(100);