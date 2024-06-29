import { LinkDirections } from '../link';
import { extendRect } from '../rect';
import { IPoint, IRect } from '../type';
import { Box, extendBox, rectToBox } from './geo';

interface IGridParams {
  getWalkable: (current: IPoint, next: IPoint) => boolean;
  getCost: (xy: number[], basic: number) => number;
}

export type Coordinate = [number, number];

export class Grid {
  grid: number[][] = [];
  costs: number[][] = [];
  pointMap: IPoint[][] = [];
  xAxis: number[] = [];
  yAxis: number[] = [];

  constructor(
    public points: IPoint[],
    public params: IGridParams
  ) {
    this.setup();
  }

  setup() {
    const points = this.points;
    const { getCost } = this.params;

    const xSet = new Set<number>();
    const ySet = new Set<number>();

    points.forEach(item => {
      xSet.add(item.x);
      ySet.add(item.y);
    });

    const row = xSet.size;
    const col = ySet.size;

    const xAxis = Array.from(xSet.values());
    const yAxis = Array.from(ySet.values());

    xAxis.sort((a, b) => a - b);
    yAxis.sort((a, b) => a - b);

    const grid = Array.from({ length: row }, () => new Array(col).fill(true));
    const costs = Array.from({ length: row }, () => new Array(col).fill(Grid.BASIC_COST));
    const pointMap = Array.from({ length: row }, () => new Array(col));

    for (let i = 0; i < row; i++) {
      for (let j = 0; j < col; j++) {
        pointMap[i][j] = { x: xAxis[j], y: yAxis[i] };
        if (getCost) {
          costs[i][j] = getCost(pointMap[i][j], Grid.BASIC_COST);
        }
      }
    }

    this.grid = grid;
    this.costs = costs;
    this.pointMap = pointMap;
    this.xAxis = xAxis;
    this.yAxis = yAxis;
  }

  getCoord(p: IPoint): Coordinate {
    return [this.xAxis.indexOf(p.x), this.yAxis.indexOf(p.y)];
  }

  getPoint(coord: Coordinate): IPoint {
    return this.pointMap[coord[0]][coord[1]];
  }

  getCost(coord: Coordinate) {
    return this.costs[coord[0]][coord[1]];
  }

  getWalkable(current: Coordinate, next: Coordinate) {
    const { getWalkable } = this.params;

    return this.isValid(next) && (getWalkable ? getWalkable(this.getPoint(current), this.getPoint(next)) : true);
  }

  private isValid(coord: number[]) {
    const row = this.grid.length;
    const col = this.grid[0].length;

    return coord[0] >= 0 && coord[0] < row && coord[1] >= 0 && coord[1] < col;
  }

  static BASIC_COST = 1;
}

export const subV = (v1: Coordinate, v2: Coordinate): Coordinate => v1.map((item, index) => item - v2[index]) as Coordinate;

export const addV = (v1: Coordinate, v2: Coordinate): Coordinate => v1.map((item, index) => item + v2[index]) as Coordinate;

export const checkDirectionIsValid = (from: Coordinate, to: Coordinate, direction: LinkDirections) => {
  const d = subV(to, from);

  let disabled = false;

  switch (direction) {
    case LinkDirections.TOP:
      disabled = d[0] < 0;
      break;
    case LinkDirections.LEFT:
      disabled = d[1] < 0;
      break;
    case LinkDirections.RIGHT:
      disabled = d[1] > 0;

      break;
    default:
      disabled = d[0] > 0;
  }

  return !disabled;
};

export interface PathFindingPointData {
  direction: LinkDirections;
  origin: IPoint;
  endpoint: IPoint;
}

export const isOppositeDirection = (dirs: LinkDirections[]) => {
  const list = [
    [LinkDirections.LEFT, LinkDirections.RIGHT],
    [LinkDirections.TOP, LinkDirections.BOTTOM]
  ];

  const conditions = [[...dirs].reverse(), dirs];

  return list.some(item => conditions.some(source => source[0] === item[0] && source[1] === item[1]));
};

const isHorizontal = (dir: LinkDirections) => dir === LinkDirections.LEFT || dir === LinkDirections.RIGHT;

export const checkCanFollowWaypoint = (
  start: PathFindingPointData,
  end: PathFindingPointData,
  waypoint: IPoint,
  grid: Grid,
  canThrough: (from: IPoint, to: IPoint) => boolean
) => {
  if (!isOppositeDirection([start.direction, end.direction])) {
    return false;
  }

  const coord = grid.getCoord(waypoint);
  const startCoord = grid.getCoord(start.endpoint);
  const endCoord = grid.getCoord(end.endpoint);
  const xLimits = [startCoord[0], endCoord[0]];
  const yLimits = [startCoord[1], endCoord[1]];

  [xLimits, yLimits].forEach(item => {
    item.sort((a, b) => a - b);
  });

  const isH = isHorizontal(start.direction);
  const base = isH ? coord[1] : coord[0];
  const limits = isH ? yLimits : xLimits;

  const getCoord = (index: number): Coordinate => (isH ? [coord[0], index] : [index, coord[1]]);

  /**
   *  水平方向 检查水平方向都能通过 直到达到结束点开始点
   *  垂直方向 检查导航点垂直方向都能通过 直到达到结束点开始点
   */

  for (let i = base, j = base; i >= limits[0] && j <= limits[1]; i--, j++) {
    if (
      !canThrough(grid.getPoint(getCoord(i)), grid.getPoint(getCoord(i + 1))) ||
      !canThrough(grid.getPoint(getCoord(j)), grid.getPoint(getCoord(j - 1)))
    ) {
      return false;
    }
  }

  return true;
};

const moveDeltaConfig = {
  [LinkDirections.LEFT]: [0, -1],
  [LinkDirections.RIGHT]: [0, 1],
  [LinkDirections.TOP]: [-1, 0],
  [LinkDirections.BOTTOM]: [1, 0]
};

const oppositeDirectionConfig = {
  [LinkDirections.LEFT]: LinkDirections.RIGHT,
  [LinkDirections.TOP]: LinkDirections.BOTTOM,
  [LinkDirections.BOTTOM]: LinkDirections.TOP,
  [LinkDirections.RIGHT]: LinkDirections.LEFT
};

const getOppositeDirection = (dir: LinkDirections) => {
  return oppositeDirectionConfig[dir];
};

export const getMoveDelta = (dir?: LinkDirections, first?: boolean) => {
  const dirs = Object.keys(moveDeltaConfig) as LinkDirections[];

  if (first) {
    const current = dirs.filter(item => item !== getOppositeDirection(dir!));

    current.sort(a => (a === dir ? -1 : 1));

    return current.map(item => moveDeltaConfig[item]);
  }

  dirs.sort((a, b) => (a === dir ? -1 : 1));

  return dirs.map(item => moveDeltaConfig[item]);
};

export const calculateManhattanDist = (p1: Coordinate, p2: Coordinate) => {
  const d = subV(p2, p1).map(Math.abs);

  return d[0] + d[1];
};

const getPointConstraintsInfo = (
  start: {
    origin: IPoint;
    direction: LinkDirections;
  },
  end: {
    origin: IPoint;
    direction: LinkDirections;
  }
): PathFindingPointData[] => {
  return [start, end].map(item => ({
    ...item,
    endpoint: { ...item.origin }
  }));
};

const cloneDeep = <T>(v: T): T => JSON.parse(JSON.stringify(v));

const checkIsContained = (origin: IPoint, box: Box | undefined, axis: number[], otherBox: Box | undefined, otherAxis: number[], index: number) => {
  // 没边界比较时不需要考虑是否包含
  if (!otherBox) {
    return true;
  }

  // 这里不能用 <= >=
  if (box) {
    return axis.some(j => box[j][index] > otherBox[otherAxis[0]][index] && box[j][index] < otherBox[otherAxis[1]][index]);
  }

  // 比存在

  return origin[index] > otherBox[otherAxis[0]][index] && origin[index] < otherBox[otherAxis[1]][index];
};

export const getBoxConstraintsInfo = (
  start: {
    box?: Box;
    origin: IPoint;
    direction: LinkDirections;
  },
  end: {
    box?: Box;
    origin: IPoint;
    direction: LinkDirections;
  },
  minDist: number,
  isCovered: boolean
): Array<PathFindingPointData & { boundaryBox?: Box; box?: Box }> => {
  if (!start.box && !end.box) {
    return getPointConstraintsInfo(start, end);
  }

  const list = [start, end].map(item => {
    return Object.assign(
      {
        ...cloneDeep(item),
        endpoint: cloneDeep(item.origin)
      },
      item.box
        ? {
            boundaryBox: extendBox(item.box, minDist),
            originBoundaryBox: extendBox(item.box, minDist)
          }
        : {}
    );
  }) as Array<
    PathFindingPointData & {
      boundaryBox?: Box;
      box?: Box;
      originBoundaryBox?: Box;
    }
  >;

  const deltaMap: Record<LinkDirections, number> = {
    [LinkDirections.TOP]: -1,
    [LinkDirections.LEFT]: -1,
    [LinkDirections.RIGHT]: 1,
    [LinkDirections.BOTTOM]: 1
  };

  const axisMap: Record<LinkDirections, [number[], number[]]> = {
    // [from, compared]
    [LinkDirections.TOP]: [
      [0, 1],
      [3, 2]
    ],
    [LinkDirections.LEFT]: [
      [0, 3],
      [1, 2]
    ],
    [LinkDirections.RIGHT]: [
      [1, 2],
      [0, 3]
    ],
    [LinkDirections.BOTTOM]: [
      [3, 2],
      [0, 1]
    ]
  };

  // 内部相交直接按内部查找
  if (isCovered) {
    list.forEach(({ direction, endpoint, origin }) => {
      const currentD = deltaMap[direction];
      const index = isHorizontal(direction) ? 0 : 1;

      endpoint[index] = origin[index] + minDist * currentD;
    });

    return list;
  }

  const allDirs = Object.keys(deltaMap) as LinkDirections[];

  list.forEach(({ box, direction, endpoint, origin, boundaryBox, originBoundaryBox }, i) => {
    allDirs.forEach(dir => {
      const axis = axisMap[dir];
      const other = list[(i + 1) % 2];
      const [currentAxis, otherAxis] = axis;
      const currentD = deltaMap[dir];
      const index = isHorizontal(dir) ? 0 : 1;
      const restIndex = index === 0 ? 1 : 0;

      const contained = checkIsContained(origin, originBoundaryBox, currentAxis, other.originBoundaryBox, otherAxis, restIndex);

      const base = box ? box[currentAxis[0]] : origin;

      const dist = other.box ? other.box[otherAxis[0]][index] - base[index] : other.origin[index] - base[index];
      // 点在其它何盒子直接相连 不需要考虑
      const d = dist > 0 ? 1 : -1;
      const pointDist = Math.abs(dist) / 2;

      const shouldAdjust = d === currentD && Math.abs(dist) < minDist * 2;
      // 方向是当前方向时且另外一个盒子存在，那么包含才需要调整 padding
      const needContained = contained;

      /**
       * 方向相对
       * 比如 [ ] - [ ]
       *     current => other
       * [ ] current
       *  |
       * [ ] other
       */
      if (needContained && shouldAdjust) {
        if (box && boundaryBox) {
          currentAxis.forEach(a => {
            boundaryBox[a][index] = box[a][index] + currentD * pointDist;
          });
        }

        if (other.box) {
          otherAxis.forEach(a => {
            // 对于被比较的盒子 距离增加相反
            other.boundaryBox![a][index] = other.box![a][index] + currentD * pointDist * -1;
          });
        }

        if (dir === direction) {
          endpoint[index] = origin[index] + currentD * pointDist;
        }
      } else if (dir === direction) {
        endpoint[index] = origin[index] + minDist * currentD;
      }
    });
  });

  return list;
};
