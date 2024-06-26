import { applyMatrix } from './matrix';
import { ITransformRect, rectToVertices } from './rect';
import { IBox, IPoint } from './type';

export const getPointsBbox = (points: IPoint[]): IBox => {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const pt of points) {
    minX = Math.min(minX, pt.x);
    minY = Math.min(minY, pt.y);
    maxX = Math.max(maxX, pt.x);
    maxY = Math.max(maxY, pt.y);
  }

  return {
    minX,
    minY,
    maxX,
    maxY
  };
};

/**
 * calculate AABB
 */
export const calcRectBbox = (transformRect: ITransformRect, paddingBeforeTransform?: number): Readonly<IBox> => {
  let x = 0;
  let y = 0;
  let width = transformRect.width;
  let height = transformRect.height;
  if (paddingBeforeTransform) {
    x -= paddingBeforeTransform;
    y -= paddingBeforeTransform;
    width += paddingBeforeTransform * 2;
    height += paddingBeforeTransform * 2;
  }
  const tf = transformRect.transform;
  const vertices = rectToVertices({
    x,
    y,
    width,
    height
  }).map(item => {
    return applyMatrix(tf, item);
  });

  return getPointsBbox(vertices);
};

/**
 * get merged rect from rects
 */
export const mergeBoxes = (boxes: IBox[]): IBox => {
  if (boxes.length === 0) {
    throw new Error('the count of boxes can not be 0');
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const box of boxes) {
    minX = Math.min(minX, box.minX);
    minY = Math.min(minY, box.minY);
    maxX = Math.max(maxX, box.maxX);
    maxY = Math.max(maxY, box.maxY);
  }

  return {
    minX,
    minY,
    maxX,
    maxY
  };
};
