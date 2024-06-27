import { Matrix } from './matrix';
import { getDistance } from './point';
import { IBox, IMatrixArr, IPoint, IRect, ISize } from './type';

export const isPointInRect = (point: IPoint, rect: IRect, padding = 0) => {
  rect = extendRect(rect, padding);
  return point.x >= rect.x && point.y >= rect.y && point.x <= rect.width + rect.x && point.y <= rect.height + rect.y;
};

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

export const getRectByPoints = (p1: IPoint, p2: IPoint, ...points: IPoint[]): IRect => {
  points = [p1, p2, ...points];
  const minX = Math.min(...points.map(p => p.x));
  const minY = Math.min(...points.map(p => p.y));
  const maxX = Math.max(...points.map(p => p.x));
  const maxY = Math.max(...points.map(p => p.y));
  return {
    x: minX,
    y: minY,
    width: Math.abs(maxX - minX),
    height: Math.abs(maxY - minY)
  };
};

export enum ResizeDirs {
  n = 'n',
  s = 's',
  e = 'e',
  w = 'w',
  nw = 'nw',
  ne = 'ne',
  sw = 'sw',
  se = 'se'
}

export interface ITransformRect {
  width: number;
  height: number;
  transform: IMatrixArr;
}

interface ResizeRectUtil {
  getLocalOrigin(width: number, height: number): IPoint;
  getNewSize(
    newLocalPt: IPoint,
    localOrigin: IPoint,
    rect: { width: number; height: number },
    p?: number
  ): {
    width: number;
    height: number;
  };
}

const resizeRectUtils: Record<ResizeDirs, ResizeRectUtil> = {
  [ResizeDirs.n]: {
    getLocalOrigin: (width, height) => ({ x: width / 2, y: height }),
    getNewSize: (newLocalPt, localOrigin, rect, p = 0) => ({
      width: rect.width,
      height: localOrigin.y - newLocalPt.y - p
    })
  },
  [ResizeDirs.e]: {
    getLocalOrigin: (_width, height) => ({ x: 0, y: height / 2 }),
    getNewSize: (newLocalPt, localOrigin, rect, p = 0) => ({
      width: newLocalPt.x - localOrigin.x - p,
      height: rect.height
    })
  },
  [ResizeDirs.s]: {
    getLocalOrigin: width => ({ x: width / 2, y: 0 }),
    getNewSize: (newLocalPt, localOrigin, rect, p = 0) => ({
      width: rect.width,
      height: newLocalPt.y - localOrigin.y - p
    })
  },
  [ResizeDirs.w]: {
    getLocalOrigin: (width, height) => ({ x: width, y: height / 2 }),
    getNewSize: (newLocalPt, localOrigin, rect, p = 0) => ({
      width: localOrigin.x - newLocalPt.x - p,
      height: rect.height
    })
  },
  [ResizeDirs.nw]: {
    getLocalOrigin: (width, height) => {
      return { x: width, y: height };
    },
    getNewSize: (newLocalPt, localOrigin, rect, p = 0) => {
      return {
        width: localOrigin.x - newLocalPt.x - p,
        height: localOrigin.y - newLocalPt.y - p
      };
    }
  },
  [ResizeDirs.ne]: {
    getLocalOrigin: (_width, height) => ({ x: 0, y: height }),
    getNewSize: (newLocalPt, localOrigin, rect, p = 0) => ({
      width: newLocalPt.x - localOrigin.x - p,
      height: localOrigin.y - newLocalPt.y - p
    })
  },
  [ResizeDirs.sw]: {
    getLocalOrigin: (width: number) => ({ x: width, y: 0 }),
    getNewSize: (newLocalPt: IPoint, localOrigin: IPoint, rect, p = 0) => ({
      width: localOrigin.x - newLocalPt.x - p,
      height: newLocalPt.y - localOrigin.y - p
    })
  },
  [ResizeDirs.se]: {
    getLocalOrigin: () => ({ x: 0, y: 0 }),
    getNewSize: (newLocalPt, localOrigin, rect, p = 0) => ({
      width: newLocalPt.x - localOrigin.x - p,
      height: newLocalPt.y - localOrigin.y - p
    })
  }
};

export const resizeRect = (dir: ResizeDirs, newGlobalPt: IPoint, rect: ITransformRect, padding: number = 0): ITransformRect => {
  const resizeOp = resizeRectUtils[dir];

  const transform = new Matrix(...rect.transform);
  const newRect = {
    width: 0,
    height: 0,
    transform: transform.clone()
  };

  const newLocalPt = transform.applyInverse(newGlobalPt);
  const localOrigin = resizeOp.getLocalOrigin(rect.width, rect.height);
  const size = resizeOp.getNewSize(newLocalPt, localOrigin, rect, padding);
  const scaleTf = new Matrix();
  scaleTf.scale(size.width / rect.width, size.height / rect.height);
  newRect.width = rect.width;
  newRect.height = rect.height;

  newRect.transform = newRect.transform.append(scaleTf);

  const newGlobalOrigin = newRect.transform.apply(resizeOp.getLocalOrigin(newRect.width, newRect.height));
  const globalOrigin = transform.apply(localOrigin);

  const offset = {
    x: globalOrigin.x - newGlobalOrigin.x,
    y: globalOrigin.y - newGlobalOrigin.y
  };
  newRect.transform.prepend(new Matrix().translate(offset.x, offset.y));
  const scaleX = Math.sign(size.width) || 1;
  const scaleY = Math.sign(size.height) || 1;
  const flipFixedTf = new Matrix()
    .translate(-newRect.width / 2, -newRect.height / 2)
    .scale(scaleX, scaleY)
    .translate(newRect.width / 2, newRect.height / 2);
  newRect.transform.append(flipFixedTf);
  return {
    width: newRect.width,
    height: newRect.height,
    transform: newRect.transform.getArray()
  };
};

export const getTransformedSize = (rect: ITransformRect): ISize => {
  const tf = new Matrix(rect.transform[0], rect.transform[1], rect.transform[2], rect.transform[3], 0, 0);
  const rightTop = tf.apply({ x: rect.width, y: 0 });
  const leftBottom = tf.apply({ x: 0, y: rect.height });
  const zero = { x: 0, y: 0 };
  return {
    width: getDistance(rightTop, zero),
    height: getDistance(leftBottom, zero)
  };
};

/**
 * 重新计算 width、height 和 transform
 * 确保 transform 后的 size 和 transform 前的 size 相同
 */
export const recomputeTransformRect = (rect: ITransformRect): ITransformRect => {
  const newSize = getTransformedSize(rect);
  const scaleX = newSize.width ? rect.width / newSize.width : 1;
  const scaleY = newSize.height ? rect.height / newSize.height : 1;
  const scaleMatrix = new Matrix().scale(scaleX, scaleY);

  const tf = new Matrix(...rect.transform).append(scaleMatrix);
  return {
    width: newSize.width,
    height: newSize.height,
    transform: tf.getArray()
  };
};

/**
 * Convert a rectangle to an array of vertices
 */
export const rectToVertices = (rect: IRect, tf?: IMatrixArr): IPoint[] => {
  const { x, y, width, height } = rect;
  let pts = [
    { x, y },
    { x: x + width, y },
    { x: x + width, y: y + height },
    { x, y: y + height }
  ];
  if (tf) {
    const matrix = new Matrix(...tf);
    pts = pts.map(point => {
      const pt = matrix.apply(point);
      return { x: pt.x, y: pt.y };
    });
  }
  return pts;
};

export const boxToRect = (box: IBox): IRect => {
  return {
    x: box.minX,
    y: box.minY,
    width: box.maxX - box.minX,
    height: box.maxY - box.minY
  };
};
