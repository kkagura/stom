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

    const endOrign = this.end instanceof LinkControl ? this.end.getSceneCenterPosition() : this.end;

    const end = {
      rect: this.end instanceof LinkControl ? this.end.getHost().getRect() : undefined,
      origin: endOrign,
      direction: this.end instanceof LinkControl ? (this.end.getTag() as Direction) : this.getEndDirection()
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
    if (this.end instanceof LinkControl) {
      return this.end.getSceneCenterPosition();
    }
    return this.end;
  }

  setEnd(end: LinkControl | IPoint) {
    if (this.end === end) return;
    if (this.end instanceof LinkControl) {
      this.end.getHost().off(CommonEvents.rectChange, this.findPathPoints);
    }

    this.end = end;
    if (end instanceof LinkControl) {
      end.getHost().on(CommonEvents.rectChange, this.findPathPoints);
    }
    this.findPathPoints();
    this.triggerChange(-1);
  }

  setEndDirection(endDirection: Direction) {
    if (this.end instanceof LinkControl) return;
    if (this._endDirection === endDirection) return;
    this._endDirection = endDirection;
    this.findPathPoints();
    this.triggerChange(1);
  }

  getEndDirection() {
    if (this.end instanceof LinkControl) return this.end.getTag() as Direction;
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
    this.getAllPoints().forEach((p, i) => {
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
}
