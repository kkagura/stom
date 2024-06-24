import { IRect, Matrix, extendRect, isPointInRect, isPointInRoundRect } from '@stom/geo';
import { BorderAttr } from './attrs';
import { Model, ModelEvents } from './model';
import { ResizeControl, resizeControlTags } from './resize-control';
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
    border: null,
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

  resizers: ResizeControl[];

  constructor(public id: string = genId()) {
    super();
    this.resizers = resizeControlTags.map(tag => new ResizeControl(this, tag));
  }

  private getRoundGap() {
    return Math.min(Math.min(this.rect.width, this.rect.height) / 2, this.attrs.roundGap ?? 0);
  }

  getRenderRect(): IRect {
    let extend = this.attrs.border?.width || 0;
    const halfAttWidth = ResizeControl.SIZE / 2 + ResizeControl.BORDER_WIDTH;
    extend += halfAttWidth;
    const rect = this.getRect();
    return extendRect(rect, extend);
  }

  hitOnControl(x: number, y: number): Control | null {
    const renderRect = this.getRenderRect();
    if (this.getIsSelected()) {
      if (!isPointInRect({ x, y }, renderRect)) {
        return null;
      }
      return this.resizers.find(c => c.hitTest(x, y)) || null;
    }
    return null;
  }

  hitTest(x: number, y: number): boolean | Control {
    if (this.getIsSelected()) {
      const renderRect = this.getRenderRect();
      if (!isPointInRect({ x, y }, renderRect)) {
        return false;
      }
      const rect = this.getRect();
      const resizer = this.resizers.find(el => el.hitTest(x - rect.x, y - rect.y));
      if (resizer) return resizer;
    }
    return isPointInRoundRect({ x, y }, this.getRenderRect(), this.getRoundGap());
  }

  paint(ctx: CanvasRenderingContext2D) {
    const { attrs } = this;
    const { x, y, width, height } = this.rect;
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
  }

  afterPaint(ctx: CanvasRenderingContext2D, editor: Editor): void {
    const rect = this.getRect();
    if (this.getIsSelected()) {
      ctx.save();
      ctx.translate(rect.x, rect.y);
      this.resizers.forEach(resizer => {
        resizer.paint(ctx);
      });
      ctx.restore();
    }
  }

  dispose() {
    this.resizers.forEach(resizer => {
      resizer.dispose();
    });
    super.dispose();
  }
}
