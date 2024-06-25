import { IRect } from '@stom/geo';
import { Model, ModelEvents } from './model';
import { Editor } from '../editor';
import { EventEmitter } from '@stom/shared';
import { CommonEvents } from './common-events';

export enum ControlEvents {
  change = 'change',
  mouseIn = 'mouseIn',
  mouseOut = 'mouseOut',
  mouseDown = 'mouseDown',
  mouseUp = 'mouseUp'
}

interface Events {
  [ControlEvents.change](): void;
  [ControlEvents.mouseIn](e: MouseEvent): void;
  [ControlEvents.mouseOut](e: MouseEvent): void;
  [ControlEvents.mouseDown](e: MouseEvent): void;
  [ControlEvents.mouseUp](e: MouseEvent): void;
}

interface ControlHost
  extends EventEmitter<{
    [CommonEvents.rectChange](): void;
    [CommonEvents.change](): void;
    [k: string]: any;
  }> {
  setPosition(x: number, y: number): void;
  setSize(dw: number, dh: number): void;
  move(dx: number, dy: number): void;
  changeSize(dw: number, dh: number): { dx: number; dy: number };
  getRect(): IRect;
  getMinWidth(): number;
  getMinHeight(): number;
}

export abstract class Control<Host extends ControlHost = ControlHost> extends EventEmitter<Events> {
  rect: IRect = {
    x: 0,
    y: 0,
    width: 0,
    height: 0
  };

  private isHovered = false;

  constructor(
    private host: Host,
    private tag: string = ''
  ) {
    super();

    this.on(ControlEvents.change, () => {
      this.getHost().emit(CommonEvents.change);
    });

    this.on(ControlEvents.mouseIn, () => {
      this.setIsHovered(true);
    });

    this.on(ControlEvents.mouseOut, () => {
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
    this.emit(ControlEvents.change);
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

  getRect() {
    return this.rect;
  }

  handleMousedown(e: MouseEvent, editor: Editor) {}

  hitTest(x: number, y: number) {
    return false;
  }

  getCursor() {
    return 'default';
  }

  abstract paint(ctx: CanvasRenderingContext2D): void;

  dispose() {
    this.clear();
  }
}
