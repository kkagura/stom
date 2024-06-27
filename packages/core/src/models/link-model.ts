import { IPoint, IRect, extendRect, getRectByPoints } from '@stom/geo';
import { Model } from './model';
import { genId } from '@stom/shared';
import { LinkControl } from './link-control';
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

  private points: IPoint[] = [];

  constructor(
    private start: LinkControl,
    private end: LinkControl | IPoint,
    public id: string = genId()
  ) {
    super(id);
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
    this.end = end;
    this.triggerChange(-1);
  }

  getAllPoints() {
    const p1 = this.getStartPoint();
    const p2 = this.getEndPoint();
    return [p1, ...this.points, p2];
  }

  getRect() {
    const p1 = this.getStartPoint();
    const p2 = this.getEndPoint();
    return getRectByPoints(p1, p2, ...this.points);
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

    // const rect = this.getRect();
    // ctx.rect(rect.x, rect.y, rect.width, rect.height);
    // ctx.stroke();
  }
}
