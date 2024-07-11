import { Direction, IRect, Matrix, extendRect, isPointInDiamond, isPointInRect, isPointInRoundRect } from '@stom/geo';
import { BorderAttr } from './attrs';
import { Model } from './model';
import { Editor } from '../editor';
import { LinkControl } from './link-control';
import { genId } from '@stom/shared';
import { Control } from './control';

export interface DiamondModelAttrs {
  border: BorderAttr | null;
  fill: boolean;
  fillColor: string;
}

export class DiamondModel extends Model<DiamondModelAttrs> {
  static CATEGORY: string = 'diamond';

  attrs: DiamondModelAttrs = {
    border: { width: 2, color: '#000', style: 'solid' },
    fill: true,
    fillColor: '#fff'
  };

  rect: IRect = {
    x: 0,
    y: 0,
    width: 200,
    height: 150
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

    const { width, height } = this.getRect();
    const tf = new Matrix().translate(width / 2, height / 2).prepend(new Matrix(...this.getWorldTransform()));
    const point = tf.applyInverse({ x, y });
    return isPointInDiamond(point, width, height, this.attrs.border?.width);
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
    const hw = width / 2;
    const hh = height / 2;
    ctx.beginPath();
    ctx.moveTo(hw, 0);
    ctx.lineTo(width, hh);
    ctx.lineTo(hw, height);
    ctx.lineTo(0, hh);
    ctx.lineTo(hw, 0);

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
    return DiamondModel.CATEGORY;
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
