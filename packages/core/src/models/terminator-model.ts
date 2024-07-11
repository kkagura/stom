import { Direction, IRect, Matrix, extendRect, isPointInRect, isPointInRoundRect } from '@stom/geo';
import { BorderAttr } from './attrs';
import { Model } from './model';
import { Editor } from '../editor';
import { LinkControl } from './link-control';
import { genId } from '@stom/shared';
import { Control } from './control';

export interface TerminatorModelAttrs {
  border: BorderAttr | null;
  fill: boolean;
  fillColor: string;
}

export class TerminatorModel extends Model<TerminatorModelAttrs> {
  static CATEGORY: string = 'terminator';

  attrs: TerminatorModelAttrs = {
    border: { width: 2, color: '#000', style: 'solid' },
    fill: true,
    fillColor: '#fff'
  };

  rect: IRect = {
    x: 0,
    y: 0,
    width: 200,
    height: 100
  };

  private linkControls: LinkControl[] = [];

  constructor(id: string = genId()) {
    super(id);

    this.linkControls = [
      new LinkControl(this, Direction.TOP),
      new LinkControl(this, Direction.RIGHT),
      new LinkControl(this, Direction.BOTTOM),
      new LinkControl(this, Direction.LEFT)
    ];
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

    const tf = new Matrix(...this.getWorldTransform());
    const point = tf.applyInverse({ x, y });
    const { width, height } = this.getRect();
    return isPointInRect(point, { x: 0, y: 0, width, height }, this.attrs?.border?.width ?? 0);
  }

  getRenderRect(): IRect {
    let extend = this.attrs.border?.width || 1;
    const rect = this.getBoundingRect();
    extend = Math.max(extend, LinkControl.SIZE / 2 + LinkControl.BORDER_WIDTH);
    return extendRect(rect, extend);
  }

  beforePaint(ctx: CanvasRenderingContext2D, editor: Editor): void {
    ctx.save();
    const transform = this.getWorldTransform();
    ctx.transform(...transform);
  }

  paint(ctx: CanvasRenderingContext2D): void {
    const { attrs } = this;
    const { width, height } = this.getRect();
    ctx.beginPath();
    let radius = Math.min(width, height) / 2;
    const centerW = Math.max(0, width - 2 * radius);
    ctx.moveTo(radius, 0);
    ctx.lineTo(radius + centerW, 0);
    ctx.arcTo(radius + centerW + radius, 0, radius + centerW + radius, height / 2, radius);
    ctx.arcTo(radius + centerW + radius, height, radius + centerW, height, radius);
    ctx.lineTo(radius, height);
    ctx.arcTo(0, height, 0, height / 2, radius);
    ctx.arcTo(0, 0, radius, 0, radius);
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
    const control = this.getActiveControl();
    if (this.getIsHovered() || control instanceof LinkControl) {
      this.linkControls.forEach(control => {
        control.paint(ctx);
      });
    }
    ctx.restore();
  }

  getCategory(): string {
    return TerminatorModel.CATEGORY;
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
