export interface IPoint {
  x: number;
  y: number;
}

export interface ISize {
  width: number;
  height: number;
}

export interface IRect extends IPoint, ISize {}

/**
 *
 * a c dx
 * b d dy
 * 0 0 1
 *
 * a：水平方向的缩放
 * b：水平方向的倾斜偏移
 * c：竖直方向的倾斜偏移
 * d：竖直方向的缩放
 * dx：水平方向的移动
 * dy：竖直方向的移动
 *
 * canvas2d.setTransform(a, b, c, d, dx, dy)
 *
 */
export type IMatrixArr = [a: number, b: number, c: number, d: number, dx: number, dy: number];

export interface IBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}
