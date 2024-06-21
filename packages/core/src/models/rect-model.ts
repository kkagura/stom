import { IRect, Matrix, isPointInRoundRect } from '@stom/geo';
import { BorderAttr } from './attrs';
import { Model } from './model';

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
    roundGap: 8
  };

  rect: IRect = {
    x: 50,
    y: 50,
    width: 100,
    height: 100
  };

  private getRoundGap() {
    return Math.min(Math.min(this.rect.width, this.rect.height) / 2, this.attrs.roundGap ?? 0);
  }

  hitTest(x: number, y: number): boolean {
    const tf = new Matrix(...this.transform);
    const point = tf.applyInverse({ x, y });
    return isPointInRoundRect(point, this.getViewRect(), this.getRoundGap());
  }

  render(ctx: CanvasRenderingContext2D) {
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

  dispose() {}
}
