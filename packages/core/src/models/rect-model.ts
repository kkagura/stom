import { Direction, IRect, Matrix, applyMatrix, extendRect, getTransformAngle, isPointInRect, isPointInRoundRect } from '@stom/geo';
import { BorderAttr } from './attrs';
import { Model, ModelEvents, ModelJson } from './model';
import { Editor } from '../editor';
import { cloneDeep, fillText, genId } from '@stom/shared';
import { Control } from './control';
import { LinkControl } from './link-control';

export interface RectModelAttrs {
  border: BorderAttr | null;
  fill: boolean;
  fillColor: string;
  roundGap: number;
}

export class RectModel extends Model<RectModelAttrs> {
  static CATEGORY = 'rect';
  attrs: RectModelAttrs = {
    border: { width: 2, color: '#000', style: 'solid' },
    fill: true,
    fillColor: '#fff',
    roundGap: 0
  };

  rect: IRect = {
    x: 0,
    y: 0,
    width: 200,
    height: 100
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

  private getRoundGap() {
    return Math.min(Math.min(this.rect.width, this.rect.height) / 2, this.attrs.roundGap ?? 0);
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

    const tf = new Matrix(...this.getWorldTransform());
    const point = tf.applyInverse({ x, y });
    const { width, height } = this.getRect();
    return isPointInRoundRect(point, { x: 0, y: 0, width, height }, this.getRoundGap());
  }

  paint(ctx: CanvasRenderingContext2D) {
    const { attrs } = this;
    const { width, height } = this.rect;
    ctx.beginPath();
    const roundGap = this.getRoundGap();
    if (roundGap) {
      ctx.roundRect(0, 0, width, height, roundGap);
    } else {
      ctx.rect(0, 0, width, height);
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
    super.afterPaint(ctx, editor);
  }

  dispose() {
    super.dispose();
  }

  getCategory(): string {
    return RectModel.CATEGORY;
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
