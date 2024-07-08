import {
  IPoint,
  IRect,
  Direction,
  extendRect,
  getRectByPoints,
  createPath,
  IMatrixArr,
  getDiretion,
  getSweepAngle,
  getOppositeDirection
} from '@stom/geo';
import { Model, ModelEvents } from './model';
import { Animation, createAnimation, genId } from '@stom/shared';
import { LinkControl } from './link-control';
import { CommonEvents } from './common-events';

export enum LinkModelEvents {
  PORT_CHANGE = 'port-change'
}
interface LinkModelAttrs {
  lineColor: string;
  lineWidth: number;
  // lineStyle: string;
  lineCap: CanvasLineCap;
  lineDash: number[];
  lineDashOffset: number;
}

export class LinkModel extends Model<LinkModelAttrs> {
  static CATEGORY = 'link';
  attrs: LinkModelAttrs = {
    lineColor: '#000',
    lineWidth: 2,
    // lineStyle: 'solid',
    lineCap: 'round',
    lineDash: [10, 10],
    lineDashOffset: -20
  };

  private controlPoints: IPoint[] = [];
  // 寻路时所有的路径点，用来debug
  private mapPoints: IPoint[] = [];

  private _endDirection: Direction = Direction.LEFT;

  private animation: Animation | null = null;

  findPathPoints = () => {
    const startHost = this.start.getHost();
    const start = {
      rect: startHost.getRect(),
      origin: this.start.getSceneCenterPosition(),
      direction: this.getStartDirection()
    };

    const endOrign = 'paint' in this.end ? this.end.getSceneCenterPosition() : this.end;

    const end = {
      rect: 'paint' in this.end ? this.end.getHost().getRect() : undefined,
      origin: endOrign,
      direction: this.getEndDirection()
    };

    const { mapPoints, controlPoints } = createPath(start, end, 20);
    this.mapPoints = mapPoints;
    this.controlPoints = controlPoints;
    controlPoints.shift();
    controlPoints.pop();
    this.emit(CommonEvents.rectChange);
    this.emit(CommonEvents.change);
  };

  constructor(
    private start: LinkControl,
    private end: LinkControl | IPoint,
    public id: string = genId()
  ) {
    super(id);
    start.getHost().on(CommonEvents.rectChange, this.findPathPoints);
    this.startAnimation();
  }

  getStartPoint() {
    return this.start.getSceneCenterPosition();
  }

  getEndPoint() {
    if ('paint' in this.end) {
      return this.end.getSceneCenterPosition();
    }
    return this.end;
  }

  setEnd(end: LinkControl | IPoint) {
    if (this.end === end) return;
    if ('paint' in this.end) {
      this.end.getHost().off(CommonEvents.rectChange, this.findPathPoints);
    }

    this.end = end;
    if ('paint' in end) {
      end.getHost().on(CommonEvents.rectChange, this.findPathPoints);
    }
    this.findPathPoints();
    this.emit(CommonEvents.change);
  }

  setEndDirection(endDirection: Direction) {
    if ('paint' in this.end) return;
    if (this._endDirection === endDirection) return;
    this._endDirection = endDirection;
    this.findPathPoints();
    this.emit(CommonEvents.change);
  }

  getStartDirection(): Direction {
    const controlCenter = this.start.getSceneCenterPosition();
    const hostCenter = this.start.getHost().getCenterPosition();
    const movement: [number, number] = [controlCenter.x - hostCenter.x, controlCenter.y - hostCenter.y];
    const x = getDiretion(movement);
    return getOppositeDirection(x);
  }

  getEndDirection(): Direction {
    if ('paint' in this.end) {
      const controlCenter = this.end.getSceneCenterPosition();
      const hostCenter = this.end.getHost().getCenterPosition();
      const movement: [number, number] = [controlCenter.x - hostCenter.x, controlCenter.y - hostCenter.y];
      const x = getDiretion(movement);
      return getOppositeDirection(x);
    }
    return this._endDirection;
  }

  getAllPoints() {
    const p1 = this.getStartPoint();
    const p2 = this.getEndPoint();
    return [p1, ...this.controlPoints, p2];
  }

  getRect() {
    const p1 = this.getStartPoint();
    const p2 = this.getEndPoint();
    return getRectByPoints(p1, p2, ...this.controlPoints);
    // debug
    // return getRectByPoints(p1, p2, ...this.controlPoints, ...this.mapPoints);
  }

  getRenderRect(): IRect {
    const rect = this.getRect();
    const extend = this.attrs.lineWidth * 2;
    return extendRect(rect, extend);
  }

  getSize() {
    const { width, height } = this.getRect();
    return {
      width,
      height
    };
  }

  getWorldTransform(): IMatrixArr {
    const { x, y } = this.getRect();
    return [1, 0, 0, 1, x, y];
  }

  paint(ctx: CanvasRenderingContext2D): void {
    ctx.beginPath();
    const points = this.getAllPoints();
    const { x, y } = points.pop()!;
    const dir = this.getEndDirection();
    // 底边
    const a = 8;
    // 高
    const h = 12;
    points.forEach((p, i) => {
      ctx[i ? 'lineTo' : 'moveTo'](p.x, p.y);
    });
    // 最后一个点需要留出画箭头的空间
    if (dir === Direction.LEFT) {
      ctx.lineTo(x - h / 2, y);
    } else if (dir === Direction.RIGHT) {
      ctx.lineTo(x + h / 2, y);
    } else if (dir === Direction.BOTTOM) {
      ctx.lineTo(x, y + h / 2);
    } else if (dir === Direction.TOP) {
      ctx.lineTo(x, y - h / 2);
    }
    const { attrs } = this;
    const w = attrs.lineWidth;
    ctx.strokeStyle = attrs.lineColor;
    ctx.lineCap = attrs.lineCap;
    ctx.lineWidth = w;
    ctx.setLineDash(attrs.lineDash);
    ctx.lineDashOffset = attrs.lineDashOffset;
    ctx.stroke();

    // 绘制箭头等腰三角形
    ctx.beginPath();
    if (dir === Direction.LEFT) {
      ctx.moveTo(x, y);
      ctx.lineTo(x - h, y - a / 2);
      ctx.lineTo(x - h, y + a / 2);
    } else if (dir === Direction.RIGHT) {
      ctx.moveTo(x, y);
      ctx.lineTo(x + h, y - a / 2);
      ctx.lineTo(x + h, y + a / 2);
    } else if (dir === Direction.BOTTOM) {
      ctx.moveTo(x, y);
      ctx.lineTo(x - a / 2, y + h);
      ctx.lineTo(x + a / 2, y + h);
    } else if (dir === Direction.TOP) {
      ctx.moveTo(x, y);
      ctx.lineTo(x - a / 2, y - h);
      ctx.lineTo(x + a / 2, y - h);
    }
    ctx.closePath();
    ctx.fillStyle = attrs.lineColor;
    ctx.fill();

    // debug

    // const renderRect = this.getRenderRect();
    // ctx.fillStyle = 'green';
    // ctx.fillRect(renderRect.x, renderRect.y, renderRect.width, renderRect.height);
    // this.mapPoints.forEach(p => {
    //   ctx.moveTo(p.x, p.y);
    //   ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    //   ctx.fillStyle = 'green';
    //   ctx.fill();
    // });

    // const rect = this.getRect();
    // ctx.rect(rect.x, rect.y, rect.width, rect.height);
    // ctx.stroke();
  }

  getCategory() {
    return LinkModel.CATEGORY;
  }

  getStart() {
    return this.start;
  }

  getStartHost() {
    return this.start.getHost();
  }

  getEnd() {
    return this.end;
  }

  getEndHost() {
    if ('getHost' in this.end) {
      return this.end.getHost();
    }
    return null;
  }

  getMovable() {
    return false;
  }

  getResizeable() {
    return false;
  }

  getRotatable() {
    return false;
  }

  startAnimation() {
    if (!this.animation) {
      const offset = this.attrs.lineDashOffset;
      this.animation = createAnimation({
        startValue: 0,
        endValue: offset,
        duration: 1000,
        loop: true,
        onUpdate: value => {
          this.setAttr('lineDashOffset', value);
        }
      });
    }
    this.animation.start();
  }

  dispose() {
    super.dispose();
    this.animation?.stop();
    this.getStartHost().off(CommonEvents.rectChange, this.findPathPoints);
    this.getEndHost()?.off(CommonEvents.rectChange, this.findPathPoints);
  }

  reset() {
    super.reset();
    this.getStartHost().on(CommonEvents.rectChange, this.findPathPoints);
    this.getEndHost()?.on(CommonEvents.rectChange, this.findPathPoints);
    this.startAnimation();
  }
}
