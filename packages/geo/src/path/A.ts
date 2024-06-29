import { LinkDirections } from '../link';
import { IPoint } from '../type';
import { APoint } from './A-point';
import { Coordinate, Grid, addV, checkDirectionIsValid, getMoveDelta, subV } from './grid';
import { Heap } from './heap';

const getDirection = (from: Coordinate, to: Coordinate) => {
  const v = subV(to, from);

  if (v[0] === 0) {
    return v[1] > 0 ? LinkDirections.BOTTOM : LinkDirections.TOP;
  }

  return v[0] > 0 ? LinkDirections.RIGHT : LinkDirections.LEFT;
};

const compressPath = (path: IPoint[]): IPoint[] => {
  // nothing to compress
  if (path.length < 3) {
    return path;
  }

  let compressed: IPoint[] = [],
    sx = path[0].x, // start x
    sy = path[0].y, // start y
    px = path[1].x, // second point x
    py = path[1].y, // second point y
    dx = px - sx, // direction between the two points
    dy = py - sy, // direction between the two points
    lx,
    ly,
    ldx,
    ldy,
    sq,
    i;

  // normalize the direction
  sq = Math.sqrt(dx * dx + dy * dy);
  dx /= sq;
  dy /= sq;

  // start the new path
  compressed.push({ x: sx, y: sy });

  for (i = 2; i < path.length; i++) {
    // store the last point
    lx = px;
    ly = py;

    // store the last direction
    ldx = dx;
    ldy = dy;

    // next point
    px = path[i].x;
    py = path[i].y;

    // next direction
    dx = px - lx;
    dy = py - ly;

    // normalize
    sq = Math.sqrt(dx * dx + dy * dy);
    dx /= sq;
    dy /= sq;

    // if the direction has changed, store the point
    if (dx !== ldx || dy !== ldy) {
      compressed.push({ x: lx, y: ly });
    }
  }

  // store the last point
  compressed.push({ x: px, y: py });

  return compressed;
};

/**
 * A*算法
 * f(n) = g(n) + h(n)
 */
export function A(
  grid: Grid,
  start: IPoint,
  end: IPoint,
  startDirection: LinkDirections,
  endDirection: LinkDirections,
  h: (point: Coordinate, grid: Grid) => number,
  index?: number
) {
  const heap = new Heap<APoint>();
  const marked = new Map<string, APoint>();
  const openMap = new Map<string, APoint>();

  const startCoord = grid.getCoord(start);
  const endCoord = grid.getCoord(end);

  const startP = new APoint(startCoord);
  const endP = new APoint(endCoord);
  const path: IPoint[] = [];

  let isFirst = true;
  let G = 0;

  heap.add(startP);
  openMap.set(startP.key, startP);

  while (openMap.size) {
    const minP = heap.peek();
    const coord = minP.coord;

    heap.remove();
    openMap.delete(minP.key);

    if (minP.key === endP.key) {
      if (minP.parent && !checkDirectionIsValid(minP.parent.coord, coord, endDirection)) {
        continue;
      }
      let tmp: APoint | null = minP;

      while (tmp) {
        path.unshift(grid.getPoint(tmp.coord));
        tmp = tmp.parent;
      }

      G = minP.G;

      break;
    }

    marked.set(minP.key, minP);

    const move = getMoveDelta(startDirection, isFirst);
    const neighbors = index !== undefined ? (isFirst ? move.slice(index, index + 1) : move) : move;
    isFirst = false;

    neighbors.forEach(([dx, dy]) => {
      const currentXY = addV(coord, [dx, dy]);
      const p = new APoint(currentXY);

      if (!marked.has(p.key) && grid.getWalkable(coord, currentXY)) {
        const previous = openMap.get(p.key);
        const dir = getDirection(coord, currentXY);
        const lastDir = minP.parent ? getDirection(minP.parent.coord, coord) : null;
        const turned = lastDir !== null && lastDir !== dir;

        const G = minP.G + grid.getCost(currentXY) + (turned ? 0.02 : 0);
        const H = h(currentXY, grid);

        p.setG(G);
        p.setH(H);

        if (!previous) {
          p.setParent(minP);

          heap.add(p);
          openMap.set(p.key, p);
        } else if (p.G < previous.G) {
          previous.setG(G);
          previous.setParent(minP);
        }
      }
    });
  }

  return {
    G,
    grid,
    path: compressPath(path)
  };
}
