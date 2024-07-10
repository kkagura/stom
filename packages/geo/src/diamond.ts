import { IPoint } from './type';

export function isPointInDiamond({ x, y }: IPoint, width: number, height: number, padding = 0) {
  width += padding;
  height += padding;
  const v1 = Math.abs(x * height) + Math.abs(y * width);
  const v2 = width * height * 0.5;
  return v1 <= v2;
}
