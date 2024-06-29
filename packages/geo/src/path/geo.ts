import { IPoint, IRect } from '../type';
import { Coordinate, addV, subV } from './grid';

export const calculateEuclideanDist = (p1: Coordinate, p2: Coordinate) => {
  return Math.hypot(...subV(p2, p1).map(Math.abs));
};

export const isCollinear = (p: Coordinate, q: Coordinate, t: Coordinate) => {
  const accuracy = 0;
  // 3点围成的三角形面积
  const area = p[0] * q[1] - p[1] * q[0] + q[0] * t[1] - q[1] * t[0] + t[0] * p[1] - t[1] * p[0];
  const edge = calculateEuclideanDist(p, q);

  return Math.abs(area / edge) <= accuracy;
};

const getCoordByPoint = (p: IPoint): Coordinate => [p.x, p.y];

export const getNumberOfInflectionPoints = (path: IPoint[]) => {
  if (path.length < 3) {
    return 0;
  }

  let count = 0;

  for (let i = 1; i < path.length - 1; i++) {
    if (!isCollinear(getCoordByPoint(path[i - 1]), getCoordByPoint(path[i + 1]), getCoordByPoint(path[i]))) {
      count++;
    }
  }

  return count;
};

export type Box = [[number, number], [number, number], [number, number], [number, number]];

export const rectToBox = (rect: IRect): Box => {
  const { x, y, width, height } = rect;
  return [
    [x, y],
    [x + width, y],
    [x + width, y + height],
    [x, y + height]
  ];
};

export const extendBox = (box: Box, d: number) => {
  const result = box.map(item => [...item]) as Box;

  result[0] = addV(result[0], [-d, -d]);
  result[1] = addV(result[1], [d, -d]);
  result[2] = addV(result[2], [d, d]);
  result[3] = addV(result[3], [-d, d]);

  return result;
};

export const getMidPoint = (p1: number[], p2: number[]) => addV(p1, p2).map(item => Math.round(item / 2));
