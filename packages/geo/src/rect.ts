import { IPoint, IRect } from './type';

export const isPointInRoundRect = (point: IPoint, rect: IRect, cornerRadii: number, padding = 0) => {
  const x = rect.x - padding;
  const y = rect.y - padding;
  const width = rect.width + padding * 2;
  const height = rect.height + padding * 2;

  if (point.x >= x && point.y >= y && point.x <= x + width && point.y <= y + height) {
    if (point.x <= x + cornerRadii && point.y <= y + cornerRadii) {
      return (point.x - x - cornerRadii) ** 2 + (point.y - y - cornerRadii) ** 2 <= cornerRadii[0] ** 2;
    } else if (point.x >= x + width - cornerRadii && point.y <= y + cornerRadii) {
      return (point.x - x - width + cornerRadii) ** 2 + (point.y - y - cornerRadii) ** 2 <= cornerRadii ** 2;
    } else if (point.x >= x + width - cornerRadii && point.y >= y + height - cornerRadii) {
      return (point.x - x - width + cornerRadii) ** 2 + (point.y - y - height + cornerRadii) ** 2 <= cornerRadii ** 2;
    } else if (point.x <= x + cornerRadii && point.y >= y + height - cornerRadii) {
      return (point.x - x - cornerRadii) ** 2 + (point.y - y - height + cornerRadii) ** 2 <= cornerRadii ** 2;
    } else {
      return true;
    }
  } else {
    return false;
  }
};

/**
 * get merged rect from rects
 */
export const mergeRects = (...rects: IRect[]): IRect => {
  if (rects.length === 0) {
    throw new Error('the count of rect can not be 0');
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const rect of rects) {
    minX = Math.min(minX, rect.x);
    minY = Math.min(minY, rect.y);
    maxX = Math.max(maxX, rect.x + rect.width);
    maxY = Math.max(maxY, rect.y + rect.height);
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
};

export const isRectIntersect = (rect1: IRect, rect2: IRect) => {
  return (
    rect1.x <= rect2.x + rect2.width && rect1.x + rect1.width >= rect2.x && rect1.y <= rect2.y + rect2.height && rect1.y + rect1.height >= rect2.y
  );
};

export const extendRect = (rect: IRect, extend: number) => {
  return {
    x: rect.x - extend,
    y: rect.y - extend,
    width: rect.width + extend * 2,
    height: rect.height + extend * 2
  };
};
