import { extendRect, getRectByPoints, rectToVertices } from './rect';
import { IPoint, IRect } from './type';

export enum LinkDirections {
  TOP = 'top',
  RIGHT = 'right',
  BOTTOM = 'bottom',
  LEFT = 'left'
}

const getDiretion = (point: IPoint) => {
  const { x, y } = point;
  const o = (Math.atan2(Math.abs(y), Math.abs(x)) / Math.PI) * 180;

  let angle = o;
  const angleBound = 45;

  // 顺时针
  if (x < 0) {
    angle = y >= 0 ? 180 - o : 180 + o;
  } else {
    angle = y >= 0 ? o : 360 - o;
  }

  let dir: LinkDirections;

  if (angle <= angleBound || angle > 360 - angleBound) {
    dir = LinkDirections.LEFT;
  } else if (angle > angleBound && angle <= 180 - angleBound) {
    dir = LinkDirections.TOP;
  } else if (angle > 180 - angleBound && angle <= 180 + angleBound) {
    dir = LinkDirections.RIGHT;
  } else {
    dir = LinkDirections.BOTTOM;
  }

  return dir;
};

export interface PortInfo {
  rect: IRect | null;
  point: IPoint;
  dir: LinkDirections | null;
}

const getBoundaryRect = (start: PortInfo, end: PortInfo, padding: number): [IRect, IRect] => {
  let startRect: IRect, endRect: IRect;
  if (start.rect) {
    startRect = extendRect(start.rect, padding);
  } else {
    startRect = {
      x: start.point.x,
      y: start.point.y,
      width: 0,
      height: 0
    };
  }
  if (end.rect) {
    endRect = extendRect(end.rect, padding);
  } else {
    endRect = {
      x: end.point.x,
      y: end.point.y,
      width: 0,
      height: 0
    };
  }
  return [startRect, endRect];
};

export const getMapPoints = (start: PortInfo, end: PortInfo, padding: number) => {
  if (!start.rect) {
    start.dir = getDiretion(start.point);
  }
  if (!end.rect) {
    end.dir = getDiretion(end.point);
  }

  const S = start.point;
  const E = end.point;
  const S1 = { ...S };
  const E1 = { ...E };
  if (padding) {
    if (start.dir === LinkDirections.TOP) {
      S1.y -= padding;
    } else if (start.dir === LinkDirections.BOTTOM) {
      S1.y += padding;
    } else if (start.dir === LinkDirections.LEFT) {
      S1.x -= padding;
    } else if (start.dir === LinkDirections.RIGHT) {
      S1.x += padding;
    }

    if (end.dir === LinkDirections.TOP) {
      E1.y -= padding;
    } else if (end.dir === LinkDirections.BOTTOM) {
      E1.y += padding;
    } else if (end.dir === LinkDirections.LEFT) {
      E1.x -= padding;
    } else if (end.dir === LinkDirections.RIGHT) {
      E1.x += padding;
    }
  }
  const [startRect, endRect] = getBoundaryRect(start, end, padding);
  const mapPoints: IPoint[] = [S, S1, E, E1];
  if (start.rect) {
    mapPoints.push(...rectToVertices(start.rect));
    mapPoints.push(...rectToVertices(startRect));
  } else {
    mapPoints.push(start.point);
  }
  if (end.rect) {
    mapPoints.push(...rectToVertices(end.rect));
    mapPoints.push(...rectToVertices(endRect));
  } else {
    mapPoints.push(start.point);
  }

  const rect = getRectByPoints(S, S1, E, E1);
  mapPoints.push(
    { x: rect.x + rect.width / 2, y: rect.y },
    { x: rect.x + rect.width, y: rect.y + rect.height / 2 },
    { x: rect.x + rect.width / 2, y: rect.y + rect.height },
    { x: rect.x, y: rect.y + rect.height / 2 },
    { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 }
  );

  return mapPoints;
};

export const createRoute = (start: PortInfo, end: PortInfo, padding: number) => {
  const mapPoints = getMapPoints(start, end, padding);
  const controlPoints: IPoint[] = [];
  return {
    mapPoints,
    controlPoints
  };
};
