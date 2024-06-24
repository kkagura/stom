import { IRect } from '@stom/geo';
import { Model } from './model';
import { Editor } from '../editor';

export abstract class Control {
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
}
