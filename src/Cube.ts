import { Mesh } from 'three';
import { Axis, Vec3 } from './types';

export class Cube {

  constructor(
    public mesh: Mesh,
    public coords: Vec3
  ) {}

  getCoord(axis: Axis) {
    const index = ['x', 'y', 'z'].indexOf(axis);
    return this.coords[index];
  }
}