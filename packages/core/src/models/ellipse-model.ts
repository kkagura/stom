import { Direction, IRect, Matrix, extendRect, isPointInEllipse, isPointInRect, isPointInRoundRect } from '@stom/geo';
import { BorderAttr } from './attrs';
import { Model, ModelEvents } from './model';
import { Editor } from '../editor';
import { genId } from '@stom/shared';
import { Control } from './control';
import { LinkControl } from './link-control';

export interface EllipseModelAttrs {
  border: BorderAttr | null;
  fill: boolean;
  fillColor: string;
}

export class EllipseModel extends Model<EllipseModelAttrs> {
  static CATEGORY = 'ellipse';
  attrs: EllipseModelAttrs = {
    border: { width: 2, color: '#000', style: 'solid' },
    fill: true,
    fillColor: '#fff'
  };

  rect: IRect = {
    x: 0,
    y: 0,
    width: 200,
    height: 200
  };

  private linkControls: LinkControl[] = [];

  constructor(public id: string = genId()) {
    super(id);

    this.linkControls = [
      new LinkControl(this, Direction.TOP),
      new LinkControl(this, Direction.RIGHT),
      new LinkControl(this, Direction.BOTTOM),
      new LinkControl(this, Direction.LEFT)
    ];
  }

  getRenderRect(): IRect {
    let extend = this.attrs.border?.width || 1;
    const rect = this.getBoundingRect();
    extend = Math.max(extend, LinkControl.SIZE / 2 + LinkControl.BORDER_WIDTH);
    return extendRect(rect, extend);
  }

  hitTest(x: number, y: number): boolean | Control {
    // 先判断点是否在绘图区域内
    if (!isPointInRect({ x, y }, this.getRenderRect())) {
      return false;
    }
    // 再判断是否在控制点上
    if (this.getIsHovered()) {
      const linkControl = this.linkControls.find(el => el.hitTest(x, y));
      if (linkControl) return linkControl;
    }

    const { width, height } = this.getRect();
    const tf = new Matrix().translate(width / 2, height / 2).prepend(new Matrix(...this.getWorldTransform()));
    const point = tf.applyInverse({ x, y });
    return isPointInEllipse(point, width / 2, height / 2, this.attrs.border?.width ?? 0);
  }

  beforePaint(ctx: CanvasRenderingContext2D, editor: Editor): void {
    ctx.save();
    const transform = this.getWorldTransform();
    ctx.transform(...transform);
  }

  paint(ctx: CanvasRenderingContext2D) {
    const { attrs } = this;
    const { width, height } = this.rect;
    const cx = width / 2,
      cy = height / 2;
    ctx.beginPath();
    if (width === height) {
      ctx.arc(cx, cy, width / 2, 0, Math.PI * 2);
    } else {
      // 虽然 a\b的值与cx/cy一样，但是一个表示的坐标，一个表示的长短轴
      // 所以还是分成两个命名来处理
      const a = width / 2,
        b = height / 2;
      const step = a > b ? 1 / a : 1 / b;
      ctx.moveTo(cx + a, cy);
      for (let i = 0; i < 2 * Math.PI; i += step) {
        ctx.lineTo(cx + a * Math.cos(i), cy + b * Math.sin(i));
      }
      ctx.closePath();
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
    this.paintText(ctx);
  }

  afterPaint(ctx: CanvasRenderingContext2D, editor: Editor): void {
    const control = this.getActiveControl();
    if (this.getIsHovered() || control instanceof LinkControl) {
      this.linkControls.forEach(control => {
        control.paint(ctx);
      });
    }
    ctx.restore();
  }

  dispose() {
    super.dispose();
  }

  getCategory(): string {
    return EllipseModel.CATEGORY;
  }

  updateControlPosition(control: Control): void {
    const rect = this.getRect();
    const { width, height } = rect;
    const tag = control.getTag();
    switch (tag) {
      case Direction.TOP:
        control.setCenterPosition(width / 2, 0);
        break;
      case Direction.RIGHT:
        control.setCenterPosition(width, height / 2);
        break;
      case Direction.BOTTOM:
        control.setCenterPosition(width / 2, height);
        break;
      case Direction.LEFT:
        control.setCenterPosition(0, height / 2);
    }
  }

  getControlByTag(tag: string): Control | null {
    return this.linkControls.find(el => el.getTag() === tag) || null;
  }
}
