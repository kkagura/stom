import { getRectByPoints } from '../rect';
import { IPoint, IRect } from '../type';

import { Direction } from './constants';
import { createRoute } from './route';

const transformPoint = (p: IPoint) => [p.x, p.y];

const transformRect = (r: IRect) => {
  const { x, y, width, height } = r;
  return [
    [x, y],
    [x + width, y],
    [x + width, y + height],
    [x, y + height]
  ];
};

const reTransformPoint = (p: number[]): IPoint => ({ x: p[0], y: p[1] });

const reTransformRect = (r: number[][]): IRect => {
  return getRectByPoints(reTransformPoint(r[0]), reTransformPoint(r[1]), reTransformPoint(r[2]), reTransformPoint(r[3]));
};

export const getDiretion = (movement: [number, number]) => {
  const o = (Math.atan2(Math.abs(movement[1]), Math.abs(movement[0])) / Math.PI) * 180;

  let angle = o;
  const angleBound = 45;

  // 顺时针
  if (movement[0] < 0) {
    angle = movement[1] >= 0 ? 180 - o : 180 + o;
  } else {
    angle = movement[1] >= 0 ? o : 360 - o;
  }

  let dir: Direction;

  if (angle <= angleBound || angle > 360 - angleBound) {
    dir = Direction.LEFT;
  } else if (angle > angleBound && angle <= 180 - angleBound) {
    dir = Direction.TOP;
  } else if (angle > 180 - angleBound && angle <= 180 + angleBound) {
    dir = Direction.RIGHT;
  } else {
    dir = Direction.BOTTOM;
  }

  return dir;
};

/**
 * 路径查找
 * 参考: https://juejin.cn/post/6971413180836741151#heading-3
 * https://link.juejin.cn/?target=https%3A%2F%2Fgithub.com%2Fraohong%2Fflowchart-orth
 */
export const createPath = (
  start: {
    rect?: IRect;
    origin: IPoint;
    direction: Direction;
  },
  end: {
    rect?: IRect;
    origin: IPoint;
    direction: Direction;
  },
  minDist: number
) => {
  const res = createRoute(
    {
      box: start.rect ? transformRect(start.rect) : undefined,
      origin: transformPoint(start.origin),
      direction: start.direction
    },
    {
      box: end.rect ? transformRect(end.rect) : undefined,
      origin: transformPoint(end.origin),
      direction: end.direction
    },
    minDist
  );
  return {
    controlPoints: res.path.path.map(reTransformPoint),
    mapPoints: res.points.map(reTransformPoint)
  };
};

export { Direction };
