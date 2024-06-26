import { IMatrixArr, IRect, ISize, calcRectBbox } from '@stom/geo';
import { EventEmitter, genId } from '@stom/shared';
import { Editor } from '../editor';
import { Control } from './control';
import { CommonEvents } from './common-events';

export enum ModelEvents {
  mouseIn = 'mouseIn',
  mouseOut = 'mouseOut',
  selected = 'selected',
  unselected = 'unselected'
}

interface Events {
  [CommonEvents.change]: () => void;
  [CommonEvents.rectChange]: (m: Model) => void;
  [ModelEvents.mouseIn]: (e: MouseEvent) => void;
  [ModelEvents.mouseOut]: (e: MouseEvent) => void;
  [ModelEvents.selected]: () => void;
  [ModelEvents.unselected]: () => void;
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

  private isHovered = false;
  private isSelected = false;

  constructor(public id: string = genId()) {
    super();

    this.on(ModelEvents.mouseIn, () => {
      this.setIsHovered(true);
    });
    this.on(ModelEvents.mouseOut, () => {
      this.setIsHovered(false);
    });

    this.on(ModelEvents.selected, () => {
      this.setIsSelected(true);
    });
    this.on(ModelEvents.unselected, () => {
      this.setIsSelected(false);
    });

    this.init();
  }

  init() {}

  /**
   * 触发改变
   * 1: 包围盒属性变化
   * 2: 交互属性变化（例如是否悬浮、是否选中）
   * @param type
   */
  triggerChange(type: number) {
    if (type === 1) {
      this.emit(CommonEvents.rectChange, this);
    }
    this.emit(CommonEvents.change);
  }

  getMinWidth() {
    return 0;
  }

  getMinHeight() {
    return 0;
  }

  getSize(): ISize {
    return { width: this.rect.width, height: this.rect.height };
  }

  setSize(w: number, h: number) {
    w = Math.max(w, this.getMinWidth());
    h = Math.max(h, this.getMinHeight());
    let changed = false;
    if (w !== this.rect.width) {
      this.rect.width = w;
      changed = true;
    }
    if (h !== this.rect.height) {
      this.rect.height = h;
      changed = true;
    }
    changed && this.triggerChange(1);
  }

  changeSize(dw: number, dh: number) {
    const oldW = this.rect.width;
    const oldH = this.rect.height;
    const w = oldW + dw;
    const h = oldH + dh;
    this.setSize(w, h);
    const newW = this.rect.width;
    const newH = this.rect.height;
    return {
      dx: newW - oldW,
      dy: newH - oldH
    };
  }

  setPosition(x: number, y: number) {
    let changed = x !== this.rect.x || y !== this.rect.y;
    this.rect.x = x;
    this.rect.y = y;
    changed && this.triggerChange(1);
  }

  move(offsetX: number, offsetY: number) {
    this.rect.x += offsetX;
    this.rect.y += offsetY;
    if (offsetX !== 0 || offsetY !== 0) {
      this.triggerChange(1);
    }
  }

  getRect(): IRect {
    return { ...this.rect };
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

  getTransform(): IMatrixArr {
    return [...this.transform];
  }

  setTransform(transform: IMatrixArr) {
    this.transform = [...transform];
  }

  getWorldTransform(): IMatrixArr {
    const [a, b, c, d] = this.transform;
    return [a, b, c, d, this.rect.x, this.rect.y];
  }

  setWorldTransform(transform: IMatrixArr) {
    const [a, b, c, d, dx, dy] = transform;
    this.transform = [a, b, c, d, 0, 0];
    this.setPosition(dx, dy);
  }

  hitTest(x: number, y: number): boolean | Control {
    return false;
  }

  beforePaint(ctx: CanvasRenderingContext2D, editor: Editor) {}

  abstract paint(ctx: CanvasRenderingContext2D): void;

  afterPaint(ctx: CanvasRenderingContext2D, editor: Editor) {}

  getIsHovered() {
    return this.isHovered;
  }

  setIsHovered(isHovered: boolean) {
    if (this.isHovered === isHovered) return;
    this.isHovered = isHovered;
    this.triggerChange(2);
  }

  getIsSelected() {
    return this.isSelected;
  }

  setIsSelected(isSelected: boolean) {
    if (this.isSelected === isSelected) return;
    this.isSelected = isSelected;
    this.triggerChange(2);
  }

  dispose() {
    this.clear();
    this.isSelected = false;
    this.isHovered = false;
  }

  getBbox() {
    return calcRectBbox({
      ...this.getSize(),
      transform: this.getWorldTransform()
    });
  }
}
