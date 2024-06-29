import { LinkDirections } from '../link';
import { isPointInRect, isRectIntersect } from '../rect';
import { IPoint, IRect } from '../type';
import { A } from './A';
import { getNumberOfInflectionPoints } from './geo';
import { Coordinate, Grid, PathFindingPointData, calculateManhattanDist, checkCanFollowWaypoint, getBoxConstraintsInfo } from './grid';

const find = (
  grid: Grid,
  {
    startInfo,
    endInfo,
    waypoint,
    isCovered,
    checkWaypointWalkable
  }: {
    startInfo: PathFindingPointData;
    endInfo: PathFindingPointData;
    waypoint?: IPoint;
    isCovered: boolean;
    checkWaypointWalkable: (from: IPoint, to: IPoint) => boolean;
  }
) => {
  const followWaypoint = waypoint && checkCanFollowWaypoint(startInfo, endInfo, waypoint, grid, checkWaypointWalkable);

  const heuristic = (current: Coordinate, grid: Grid) => {
    const h1 = calculateManhattanDist(current, grid.getCoord(endInfo.endpoint));

    if (!followWaypoint) {
      return h1;
    }

    return h1 + calculateManhattanDist(current, grid.getCoord(waypoint!));
  };

  if (isCovered) {
    const temp = A(grid, startInfo.endpoint, endInfo.endpoint, startInfo.direction, endInfo.direction, heuristic);
    temp.path.push(endInfo.origin);
    temp.path.unshift(startInfo.origin);

    return temp;
  }

  const result = [0, 1, 2, 4]
    .map(index => A(grid, startInfo.endpoint, endInfo.endpoint, startInfo.direction, endInfo.direction, heuristic, index))
    .filter(item => item.path.length);

  let target: { path: IPoint[]; grid: Grid; G: number } | null = null;
  let min1 = Infinity;
  let min2 = Infinity;

  result.forEach(item => {
    const completedPath = [...item.path];

    completedPath.push(endInfo.origin);
    completedPath.unshift(startInfo.origin);

    const d1 = getNumberOfInflectionPoints(item.path);
    const d2 = getNumberOfInflectionPoints(completedPath);

    /**
     * 1. 拐点数都相同时取最小的 G
     * 2. 先取不包含起始点的最小拐点数，再判断包含了起始点的最小拐点数
     */
    if (d1 < min1 || (d1 === min1 && d2 < min2) || (d1 === min1 && d2 === min2 && item.G < target!.G)) {
      min1 = d1;
      min2 = d2;
      target = item;
    }
  });

  if (!target) {
    target = {
      grid,
      path: [],
      G: Infinity
    };

    console.warn('Path not found');
  }

  target!.path.push(endInfo.origin);
  target!.path.unshift(startInfo.origin);

  return target;
};

const getPathFindingData = (
  start: {
    rect?: IRect;
    origin: IPoint;
    direction: LinkDirections;
  },
  end: {
    rect?: IRect;
    origin: IPoint;
    direction: LinkDirections;
  },
  minDist: number
) => {
  // 两个盒子相交
  const isIntersect = start.rect && end.rect ? isRectIntersect(start.rect, end.rect) : false;
  const testBoxs = [
    [start.origin, end.rect],
    [end.origin, start.rect]
  ].filter(item => item[1]) as [IPoint, IRect][];

  // 起始点结速点都被另外一个盒子覆盖
  const isCovered = testBoxs.every(([p, rect]) => rect && isPointInRect(p, rect));
  const [startInfo, endInfo] = getBoxConstraintsInfo(start, end, minDist, isCovered);

  const midPoint = getMidPoint(startInfo.endpoint, endInfo.endpoint);
  const middlePoints = [
    [startInfo.endpoint[0], midPoint[1]],
    [endInfo.endpoint[0], midPoint[1]],
    [midPoint[0], startInfo.endpoint[1]],
    [midPoint[0], endInfo.endpoint[1]],
    midPoint
  ];

  const waypoint = midPoint;
  const allPoints: number[][] = [startInfo.endpoint, endInfo.endpoint, ...middlePoints];

  if (!isCovered) {
    allPoints.push(...(startInfo.boundaryBox ?? []), ...(endInfo.boundaryBox ?? []));
  }

  return {
    isIntersect,
    isCovered,
    startInfo,
    endInfo,
    allPoints: uniqPoints(getIntersectPoints(allPoints)),
    waypoint
  };
};

export const createRoute = (
  start: {
    box?: number[][];
    origin: number[];
    direction: LinkDirections;
  },
  end: {
    box?: number[][];
    origin: number[];
    direction: LinkDirections;
  },
  minDist: number
) => {
  const { isCovered, isIntersect, startInfo, endInfo, allPoints, waypoint } = getPathFindingData(start, end, minDist);

  const checkedBoxs = [
    startInfo.boundaryBox && extendBox(startInfo.boundaryBox, -1),
    endInfo.boundaryBox && extendBox(endInfo.boundaryBox, -1)
  ].filter(Boolean) as number[][][];

  const checkedInnerBoxs = [startInfo.box, endInfo.box].filter(Boolean) as number[][][];

  // 相交且不是 coverd 并且方向相对才限制路径
  const costFactor = isIntersect ? (!isCovered && isOppositeDirection([startInfo.direction, endInfo.direction]) ? 2 : 0) : 5;
  const shouldCheck = checkedBoxs.length === 2 ? !isIntersect : !isCovered;

  const grid = new Grid(allPoints, {
    getCost(p, basic) {
      const t = [0, 1].reduce((total, index) => {
        // 走里面的 cost 更多
        if (checkedInnerBoxs[index] && inView(p, checkedInnerBoxs[index])) {
          return total + 2;
        }

        if (checkedBoxs[index] && inView(p, checkedBoxs[index])) {
          return total + 1;
        }

        return total;
      }, 0);

      return basic + t * costFactor;
    },
    getWalkable(current: number[], next: number[]) {
      if (shouldCheck) {
        return checkedBoxs.every(item => !lineRect(current, next, item));
      }

      return true;
    }
  });

  const result = find(grid, {
    startInfo,
    endInfo,
    isCovered,
    waypoint: isOppositeDirection([startInfo.direction, endInfo.direction]) ? waypoint : undefined,
    checkWaypointWalkable: (from, to) => {
      if (isCovered) {
        return true;
      }

      return checkedBoxs.every(item => !lineRect(from, to, item));
    }
  });

  return {
    path: result,
    points: result.grid.points,
    boxs: [
      {
        fill: 'red',
        box: startInfo.boundaryBox
      },
      {
        fill: 'green',
        box: endInfo.boundaryBox
      }
    ]
  };
};
