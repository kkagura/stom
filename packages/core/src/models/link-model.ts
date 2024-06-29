import { IPoint, IRect, LinkDirections, createRoute, extendRect, getRectByPoints } from '@stom/geo';
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

  constructor(
    private start: LinkControl,
    private end: LinkControl | IPoint,
    public id: string = genId()
  ) {
    super(id);
    start.getHost().on(CommonEvents.rectChange, this.findPathPoints);
  }

  findPathPoints = () => {
    const startHost = this.start.getHost();
    const start = {
      rect: startHost.getRect(),
      point: this.start.getSceneCenterPosition(),
      dir: this.start.getTag() as LinkDirections
    };

    const end = {
      rect: this.end instanceof LinkControl ? this.end.getHost().getRect() : null,
      point: this.end instanceof LinkControl ? this.end.getSceneCenterPosition() : this.end,
      dir: this.end instanceof LinkControl ? (this.end.getTag() as LinkDirections) : null
    };

    const { mapPoints, controlPoints } = createRoute(start, end, 20);
    this.mapPoints = mapPoints;
    this.controlPoints = controlPoints;
    this.triggerChange(1);
  };

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

  getAllPoints() {
    const p1 = this.getStartPoint();
    const p2 = this.getEndPoint();
    return [p1, ...this.controlPoints, p2];
  }

  getRect() {
    const p1 = this.getStartPoint();
    const p2 = this.getEndPoint();
    // return getRectByPoints(p1, p2, ...this.controlPoints);
    // debug
    return getRectByPoints(p1, p2, ...this.controlPoints, ...this.mapPoints);
  }

  getRenderRect(): IRect {
    const rect = this.getRect();
    const extend = this.attrs.lineWidth * 2;
    return extendRect(rect, extend);
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
    this.mapPoints.forEach(p => {
      ctx.moveTo(p.x, p.y);
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = 'green';
      ctx.fill();
    });

    // const rect = this.getRect();
    // ctx.rect(rect.x, rect.y, rect.width, rect.height);
    // ctx.stroke();
  }
}