import { tuple } from 'rhax';
import { Cube } from './Cube';
import { Axis, Sign, Vec3 } from './types';

export interface Rotation {
  axis: Axis;
  sign: Sign;
  clockwise: boolean;
}

export namespace Rotation {
  export function equal(r1: Rotation, r2: Rotation): boolean {
    return (r1.axis === r2.axis) && (r1.sign === r2.sign) && (r1.clockwise === r2.clockwise);
  }

  export function inverse(r: Rotation): Rotation {
    return {
      axis: r.axis,
      sign: r.sign,
      clockwise: !r.clockwise
    };
  }

  const getCoordTransformer = (rotation: Rotation): (vec: Vec3) => Vec3 => {
    const { axis, sign, clockwise } = rotation;
    const s = sign * (clockwise ? 1 : -1);

    return ({
      x: ([x, y, z]: Vec3) => tuple(x, s * z,s * -y),
      y: ([x, y, z]: Vec3) => tuple(s * -z, y, s * x),
      z: ([x, y, z]: Vec3) => tuple(s * y, s * -x, z)
    })[axis]
  }

  export function apply(faceCubes: Cube[], rotation: Rotation) {

    const coordTransformer = getCoordTransformer(rotation);
    for (const cube of faceCubes) {
      cube.coords = coordTransformer(cube.coords);
    }
  }
}

export const rotations: Rotation[] = (() => {
  const rotations: Rotation[] = [];

  for (const axis of ['x', 'y', 'z'] as Axis[]) {
    for (const sign of [1, -1] as Sign[]) {
      for (const clockwise of [true, false]) {
        rotations.push({ axis, sign, clockwise })
      }
    }
  }

  return rotations;
})();