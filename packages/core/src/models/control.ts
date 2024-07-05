import { IMatrixArr, IPoint, IRect, Matrix, isPointInRect } from '@stom/geo';
import { Model, ModelEvents } from './model';
import { Editor } from '../editor';
import { EventEmitter } from '@stom/shared';
import { CommonEvents } from './common-events';

interface Events {
  [CommonEvents.change](): void;
  [CommonEvents.mouseIn](e: MouseEvent): void;
  [CommonEvents.mouseOut](e: MouseEvent): void;
  [CommonEvents.mouseDown](e: MouseEvent): void;
  [CommonEvents.mouseUp](e: MouseEvent): void;
}

interface ControlHost
  extends EventEmitter<{
    [CommonEvents.rectChange](): void;
    [CommonEvents.change](): void;
    [k: string]: any;
  }> {
  getRect(): IRect;

  getActiveControl(): Control | null;
  setActiveControl(control: Control | null): void;

  getWorldTransform(): IMatrixArr;
}

export abstract class Control<Host extends ControlHost = ControlHost> extends EventEmitter<Events> {
  rect: IRect = {
    x: 0,
    y: 0,
    width: 0,
    height: 0
  };

  private isHovered = false;

  private isActive = false;

  constructor(
    private host: Host,
    private tag: string = ''
  ) {
    super();

    this.on(CommonEvents.change, () => {
      this.getHost().emit(CommonEvents.change);
    });

    this.on(CommonEvents.mouseIn, () => {
      this.setIsHovered(true);
    });

    this.on(CommonEvents.mouseOut, () => {
      this.setIsHovered(false);
    });

    this.init();
  }

  init() {}

  updatePosition() {}

  getIsHovered() {
    return this.isHovered;
  }

  setIsHovered(isHovered: boolean) {
    if (isHovered === this.isHovered) return;
    this.isHovered = isHovered;
    this.emit(CommonEvents.change);
  }

  getIsActive() {
    return this.isActive;
  }

  setIsActive(isActive: boolean) {
    if (isActive === this.isActive) return;
    this.isActive = isActive;
    this.getHost().setActiveControl(isActive ? this : null);
    this.emit(CommonEvents.change);
  }

  getHost() {
    return this.host;
  }

  getTag() {
    return this.tag;
  }

  setSize(w: number, h: number) {
    if (w === this.rect.width && h === this.rect.height) return;
    this.rect.width = w;
    this.rect.height = h;
  }

  setPosition(x: number, y: number) {
    if (x === this.rect.x && y === this.rect.y) return;
    this.rect.x = x;
    this.rect.y = y;
  }

  getCenterPosition(): IPoint {
    return {
      x: this.rect.x + this.rect.width / 2,
      y: this.rect.y + this.rect.height / 2
    };
  }

  setCenterPosition(centerX: number, centerY: number) {
    const { x, y, width, height } = this.rect;
    const newX = centerX - width / 2;
    const newY = centerY - height / 2;
    if (newX === x && newY === y) return;
    this.rect.x = newX;
    this.rect.y = newY;
  }

  getScenePosition(): IPoint {
    const host = this.getHost();
    const { x, y } = host.getRect();
    return {
      x: x + this.rect.x,
      y: y + this.rect.y
    };
  }

  getSceneCenterPosition(): IPoint {
    const host = this.getHost();
    const m = host.getWorldTransform();
    const p = {
      x: this.rect.x + this.rect.width / 2,
      y: this.rect.y + this.rect.height / 2
    };
    return new Matrix(...m).apply(p);
  }

  getRect() {
    return this.rect;
  }

  handleMousedown(e: MouseEvent, editor: Editor) {}

  hitTest(x: number, y: number): boolean {
    const tf = new Matrix(...this.getHost().getWorldTransform());
    const point = tf.applyInverse({ x, y });
    return isPointInRect(point, this.getRect());
  }

  getCursor() {
    return 'default';
  }

  abstract paint(ctx: CanvasRenderingContext2D): void;

  dispose() {
    this.clear();
  }
}
