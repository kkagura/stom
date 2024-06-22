import { IMatrixArr, IRect } from '@stom/geo';
import { EventEmitter, genId } from '@stom/shared';

export enum ModelEvents {
  change = 'change'
}

interface Events {
  [ModelEvents.change]: (m: Model) => void;
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

  private isHover = false;

  private isSelected = false;

  private layerId: string = '';

  constructor(public id: string = genId()) {
    super();
  }

  triggerChange() {
    this.emit(ModelEvents.change, this);
  }

  setSize(w: number, h: number) {
    this.rect.width = w;
    this.rect.height = h;
    this.triggerChange();
  }

  setPosition(x: number, y: number) {
    this.rect.x = x;
    this.rect.y = y;
    this.triggerChange();
  }

  move(x: number, y: number) {
    this.rect.x += x;
    this.rect.y += y;
    if (x !== 0 || y !== 0) {
      this.triggerChange();
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

  setIsHover(bool) {
    this.isHover = bool;
    this.triggerChange();
  }

  getIsHover() {
    return this.isHover;
  }

  setIsSelected(bool) {
    this.isSelected = bool;
    this.triggerChange();
  }

  getIsSelected() {
    return this.isSelected;
  }

  abstract render(ctx: CanvasRenderingContext2D): void;

  abstract dispose(): void;
}
