import { Matrix } from './matrix';
import { IMatrixArr, IPoint } from './type';

/**
 * get sweep angle from vector a to vector b
 * direction is clockwise
 */
export const getSweepAngle = (a: IPoint, b: IPoint) => {
  // 点乘求夹角
  const dot = a.x * b.x + a.y * b.y;
  const d = Math.sqrt(a.x * a.x + a.y * a.y) * Math.sqrt(b.x * b.x + b.y * b.y);
  let cosTheta = dot / d;
  if (cosTheta > 1) {
    cosTheta = 1;
  } else if (cosTheta < -1) {
    cosTheta = -1;
  }

  let theta = Math.acos(cosTheta);
  if (a.x * b.y - a.y * b.x < 0) {
    theta = Math.PI * 2 - theta;
  }

  return theta;
};

/**
 * get angle of transform matrix
 */
export const getTransformAngle = (transform: IMatrixArr, angleBase = { x: 0, y: -1 }) => {
  const tf = new Matrix(transform[0], transform[1], transform[2], transform[3], 0, 0);
  const angleVec = tf.apply(angleBase);
  return getSweepAngle(angleBase, angleVec);
};

export const radiansToDegrees = (radians: number): number => {
  return radians * (180 / Math.PI);
};

export const degreesToRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};
