import { IPoint, IRect, Direction, extendRect, getRectByPoints, createPath, IMatrixArr } from '@stom/geo';
import { Model, ModelEvents } from './model';
import { genId } from '@stom/shared';
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
}

export class LinkModel extends Model<LinkModelAttrs> {
  static CATEGORY = 'link';
  attrs: LinkModelAttrs = {
    lineColor: '#000',
    lineWidth: 2,
    // lineStyle: 'solid',
    lineCap: 'round',
    lineDash: []
  };

  private controlPoints: IPoint[] = [];
  // 寻路时所有的路径点，用来debug
  private mapPoints: IPoint[] = [];

  private _endDirection: Direction = Direction.LEFT;

  findPathPoints = () => {
    // todo: 处理节点旋转的情况
    const startHost = this.start.getHost();
    const start = {
      rect: startHost.getRect(),
      origin: this.start.getSceneCenterPosition(),
      direction: this.start.getTag() as Direction
    };

    const endOrign = 'paint' in this.end ? this.end.getSceneCenterPosition() : this.end;

    const end = {
      rect: 'paint' in this.end ? this.end.getHost().getRect() : undefined,
      origin: endOrign,
      direction: 'paint' in this.end ? (this.end.getTag() as Direction) : this.getEndDirection()
    };

    const { mapPoints, controlPoints } = createPath(start, end, 20);
    this.mapPoints = mapPoints;
    this.controlPoints = controlPoints;
    controlPoints.shift();
    controlPoints.pop();
    this.triggerChange(1);
  };

  constructor(
    private start: LinkControl,
    private end: LinkControl | IPoint,
    public id: string = genId()
  ) {
    super(id);
    start.getHost().on(CommonEvents.rectChange, this.findPathPoints);
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
    this.triggerChange(-1);
  }

  setEndDirection(endDirection: Direction) {
    if ('paint' in this.end) return;
    if (this._endDirection === endDirection) return;
    this._endDirection = endDirection;
    this.findPathPoints();
    this.triggerChange(1);
  }

  getEndDirection() {
    if ('paint' in this.end) return this.end.getTag() as Direction;
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
    points.forEach((p, i) => {
      ctx[i ? 'lineTo' : 'moveTo'](p.x, p.y);
    });
    const { attrs } = this;
    ctx.strokeStyle = attrs.lineColor;
    ctx.lineCap = attrs.lineCap;
    ctx.lineWidth = attrs.lineWidth;
    ctx.setLineDash(attrs.lineDash);
    ctx.stroke();
    ctx.beginPath();

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

  dispose() {
    super.dispose();
    this.getStartHost().off(CommonEvents.rectChange, this.findPathPoints);
    this.getEndHost()?.off(CommonEvents.rectChange, this.findPathPoints);
  }

  reset() {
    super.reset();
    this.getStartHost().on(CommonEvents.rectChange, this.findPathPoints);
    this.getEndHost()?.on(CommonEvents.rectChange, this.findPathPoints);
  }
}
