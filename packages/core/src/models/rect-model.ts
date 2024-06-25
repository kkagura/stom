import { IRect, Matrix, extendRect, isPointInRect, isPointInRoundRect } from '@stom/geo';
import { BorderAttr } from './attrs';
import { Model, ModelEvents } from './model';
import { Editor } from '../editor';
import { genId } from '@stom/shared';
import { Control } from './control';

export interface RectModelAttrs {
  border: BorderAttr | null;
  fill: boolean;
  fillColor: string;
  roundGap: number;
}

export class RectModel extends Model<RectModelAttrs> {
  attrs: RectModelAttrs = {
    border: { width: 2, color: 'green', style: 'solid' },
    fill: true,
    fillColor: '#000',
    roundGap: 0
  };

  rect: IRect = {
    x: 50,
    y: 50,
    width: 100,
    height: 100
  };

  constructor(public id: string = genId()) {
    super();
  }

  private getRoundGap() {
    return Math.min(Math.min(this.rect.width, this.rect.height) / 2, this.attrs.roundGap ?? 0);
  }

  getRenderRect(): IRect {
    const extend = this.attrs.border?.width || 1;
    const rect = this.getRect();
    return extendRect(rect, extend);
  }

  hitTest(x: number, y: number): boolean | Control {
    return isPointInRoundRect({ x, y }, this.getRenderRect(), this.getRoundGap());
  }

  paint(ctx: CanvasRenderingContext2D) {
    const { attrs } = this;
    const { x, y, width, height } = this.rect;
    ctx.save();
    const transform = this.getTransform();
    ctx.transform(...transform);
    ctx.beginPath();
    const roundGap = this.getRoundGap();
    if (roundGap) {
      ctx.roundRect(x, y, width, height, roundGap);
    } else {
      ctx.rect(x, y, width, height);
    }
    if (attrs.fill) {
      ctx.fillStyle = attrs.fillColor;
      ctx.fill();
    }
    if (attrs.border?.width) {
      ctx.strokeStyle = attrs.border.color;
      ctx.lineWidth = attrs.border.width;
      ctx.stroke();
    }
    ctx.restore();
  }

  afterPaint(ctx: CanvasRenderingContext2D, editor: Editor): void {}

  dispose() {
    super.dispose();
  }
}
