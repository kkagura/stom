import { IMatrixArr, IRect } from '@stom/geo';
import { EventEmitter, genId } from '@stom/shared';
import { Editor } from '../editor';

export enum ModelEvents {
  change = 'change',
  renderRectChange = 'renderRectChange'
}

interface Events {
  [ModelEvents.change]: (m: Model) => void;
  [ModelEvents.renderRectChange]: (m: Model) => void;
}

export abstract class Model<Attrs extends Record<string, any> = any> extends EventEmitter<Events> {
  abstract attrs: Attrs;
  rect: IRect = {
    x: 0,
    y: 0,
    width: 0,
    height: 0
  };

  transform: IMatrixArr = [1, 0, 0, 1, 0, 0];

  private layerId: string = '';

  constructor(public id: string = genId()) {
    super();
  }

  /**
   * 触发改变
   * 1: 包围盒属性变化
   * @param type
   */
  triggerChange(type: number) {
    if (type === 1) {
      this.emit(ModelEvents.renderRectChange, this);
    }
    this.emit(ModelEvents.change, this);
  }

  setSize(w: number, h: number) {
    this.rect.width = w;
    this.rect.height = h;
    this.triggerChange(1);
  }

  setPosition(x: number, y: number) {
    this.rect.x = x;
    this.rect.y = y;
    this.triggerChange(1);
  }

  move(x: number, y: number) {
    this.rect.x += x;
    this.rect.y += y;
    if (x !== 0 || y !== 0) {
      this.triggerChange(1);
    }
  }

  getRect(): IRect {
    return this.rect;
  }

  getRenderRect(): IRect {
    return this.rect;
  }

  getLayerId() {
    return this.layerId;
  }

  setLayerId(id: string) {
    this.layerId = id;
  }

  hitTest(x: number, y: number): boolean {
    return false;
  }

  beforePaint(ctx: CanvasRenderingContext2D, editor: Editor) {}

  abstract paint(ctx: CanvasRenderingContext2D): void;

  afterPaint(ctx: CanvasRenderingContext2D, editor: Editor) {}

  abstract dispose(): void;
}
