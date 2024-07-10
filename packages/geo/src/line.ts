import { getDistance } from './point';
import { ILineSegment, IPoint } from './type';

export function isPointInLineSegment(point: IPoint, [lineStart, lineEnd]: ILineSegment) {
  // 计算向量
  const vectorPS = { x: lineStart.x - point.x, y: lineStart.y - point.y };
  const vectorPE = { x: lineEnd.x - point.x, y: lineEnd.y - point.y };
  const vectorSE = { x: lineEnd.x - lineStart.x, y: lineEnd.y - lineStart.y };

  // 判断点P是否在直线SE上
  const crossProduct = vectorPS.x * vectorSE.y - vectorPS.y * vectorSE.x;
  if (Math.abs(crossProduct) > Number.EPSILON) {
    return false; // 点不在直线上
  }

  // 判断点P是否在区间SE上
  const dotProduct = vectorPS.x * vectorSE.x + vectorPS.y * vectorSE.y;
  if (dotProduct < 0) return false; // 点P在S点左侧

  const squareLengthSE = vectorSE.x * vectorSE.x + vectorSE.y * vectorSE.y;
  if (dotProduct > squareLengthSE) return false; // 点P在E点右侧

  return true; // 点在线段上
}

function getClosestPointOnLineSegment(point: IPoint, [lineStart, lineEnd]: ILineSegment) {
  let t =
    ((point.x - lineStart.x) * (lineEnd.x - lineStart.x) + (point.y - lineStart.y) * (lineEnd.y - lineStart.y)) /
    ((lineEnd.x - lineStart.x) ** 2 + (lineEnd.y - lineStart.y) ** 2);

  t = Math.max(0, Math.min(1, t));

  return {
    x: lineStart.x + t * (lineEnd.x - lineStart.x),
    y: lineStart.y + t * (lineEnd.y - lineStart.y)
  };
}

export function getLineSegmentsByPoints(points: IPoint[]): ILineSegment[] {
  if (points.length < 2) return [];
  const lineSegments: ILineSegment[] = [];

  for (let i = 0; i < points.length - 1; i++) {
    lineSegments.push([points[i], points[i + 1]]);
  }

  return lineSegments;
}

export function isPointNearLineSegment(point: IPoint, [lineStart, lineEnd]: ILineSegment, lineWidth: number) {
  if (lineWidth === 0) return isPointInLineSegment(point, [lineStart, lineEnd]);
  const closestPoint = getClosestPointOnLineSegment(point, [lineStart, lineEnd]);
  const distance = getDistance(point, closestPoint);

  return distance <= lineWidth / 2;
}

export function isPointNearLineSegments(point: IPoint, segments: ILineSegment[], lineWidth: number) {
  return segments.some(s => isPointNearLineSegment(point, s, lineWidth));
}
