import { IRect } from '@stom/geo';
import { Model } from './model';
import { Editor } from '../editor';
import { EventEmitter } from '@stom/shared';

export enum ControlEvents {
  change = 'change',
  mouseIn = 'mouseIn',
  mouseOut = 'mouseOut',
  mouseDown = 'mouseDown',
  mouseUp = 'mouseUp'
}

interface Events {
  [ControlEvents.change]: () => void;
  [ControlEvents.mouseIn]: (e: MouseEvent) => void;
  [ControlEvents.mouseOut]: (e: MouseEvent) => void;
  [ControlEvents.mouseDown]: (e: MouseEvent) => void;
  [ControlEvents.mouseUp]: (e: MouseEvent) => void;
}

export abstract class Control<T extends Record<string | symbol, any> = Events> extends EventEmitter<T> {
  rect: IRect = {
    x: 0,
    y: 0,
    width: 0,
    height: 0
  };

  constructor(
    private parent: Model,
    private tag: string
  ) {
    super();
    this.init();
  }

  init() {}

  getParent() {
    return this.parent;
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
