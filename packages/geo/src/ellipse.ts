import { IPoint } from './type';

export function isPointInEllipse({ x, y }: IPoint, a: number, b: number, padding = 0) {
  a += padding;
  b += padding;
  if (a === b) {
    return x * x + y * y <= a * a;
  }

  const val = (x * x) / (a * a) + (y * y) / (b * b);
  return val <= 1;
}
