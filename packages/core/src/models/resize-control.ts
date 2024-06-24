import { IRect, isPointInRect } from '@stom/geo';
import { Control } from './control';
import { Model, ModelEvents } from './model';
import { Action } from '../action-manager';
import { Editor } from '../editor';

export enum ResizeTag {
  tl = 'tl',
  tr = 'tr',
  bl = 'bl',
  br = 'br',
  t = 't',
  r = 'r',
  b = 'b',
  l = 'l'
}

export const resizeControlTags = Object.values(ResizeTag);

export class ResizeControl extends Control {
  init() {
    this.setSize(ResizeControl.SIZE, ResizeControl.SIZE);
    this.updatePosition();
    this.getParent().on(ModelEvents.renderRectChange, () => {
      this.updatePosition();
    });
  }

  updatePosition() {
    const { width, height } = this.getParent().getRect();
    const halfAttWidth = ResizeControl.SIZE / 2;
    const tag = this.getTag();
    if (tag === ResizeTag.tl) {
      this.setPosition(0 - halfAttWidth, 0 - halfAttWidth);
    } else if (tag === ResizeTag.tr) {
      this.setPosition(width - halfAttWidth, 0 - halfAttWidth);
    } else if (tag === ResizeTag.bl) {
      this.setPosition(0 - halfAttWidth, height - halfAttWidth);
    } else if (tag === ResizeTag.br) {
      this.setPosition(width - halfAttWidth, height - halfAttWidth);
    } else if (tag === ResizeTag.t) {
      this.setPosition(width / 2 - halfAttWidth, 0 - halfAttWidth);
    } else if (tag === ResizeTag.r) {
      this.setPosition(width - halfAttWidth, height / 2 - halfAttWidth);
    } else if (tag === ResizeTag.l) {
      this.setPosition(0 - halfAttWidth, height / 2 - halfAttWidth);
    } else if (tag === ResizeTag.b) {
      this.setPosition(width / 2 - halfAttWidth, height - halfAttWidth);
    }
  }

  paint(ctx: CanvasRenderingContext2D): void {
    const rect = this.getRect();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.width, rect.height);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.strokeStyle = ResizeControl.BORDER_COLOR;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  hitTest(x: number, y: number): boolean {
    return isPointInRect({ x, y }, this.getRect(), ResizeControl.BORDER_WIDTH);
  }

  handleMousedown(e: MouseEvent, editor: Editor) {
    const zoom = editor.viewportManager.getZoom();
    const startX = e.clientX,
      startY = e.clientY;
    let lastX = startX,
      lastY = startY;
    const parent = this.getParent();
    const tag = this.getTag();
    const oldRect = { ...parent.getRect() };
    const onMove = (ev: MouseEvent) => {
      const cx = ev.clientX,
        cy = ev.clientY;
      const dx = (cx - lastX) / zoom,
        dy = (cy - lastY) / zoom;
      lastX = cx;
      lastY = cy;
      const { x, y, width, height } = parent.getRect();
      const minW = parent.getMinWidth();
      const minH = parent.getMinHeight();

      switch (tag) {
        case ResizeTag.tl: {
          const newW = Math.max(minW, width - dx);
          const newH = Math.max(minH, height - dy);
          const offsetX = newW - width;
          const offsetY = newH - height;
          parent.setPosition(x - offsetX, y - offsetY);
          parent.setSize(newW, newH);
          break;
        }
        case ResizeTag.tr: {
          const newW = Math.max(minW, width + dx);
          const newH = Math.max(minH, height - dy);
          const offsetY = newH - height;
          parent.setPosition(x, y - offsetY);
          parent.setSize(newW, newH);
          break;
        }

        case ResizeTag.t: {
          const newH = Math.max(minH, height - dy);
          const offsetY = newH - height;
          parent.setPosition(x, y - offsetY);
          parent.setSize(width, newH);
          break;
        }

        case ResizeTag.l: {
          const newW = Math.max(minW, width - dx);
          const offsetX = newW - width;
          parent.setPosition(x - offsetX, y);
          parent.setSize(newW, height);
          break;
        }

        case ResizeTag.r: {
          const newW = Math.max(minW, width + dx);
          parent.setSize(newW, height);
          break;
        }

        case ResizeTag.bl: {
          const newW = Math.max(minW, width - dx);
          const newH = Math.max(minH, height + dy);
          const offsetX = newW - width;
          parent.setPosition(x - offsetX, y);
          parent.setSize(newW, newH);
          break;
        }

        case ResizeTag.b: {
          const newH = Math.max(minH, height + dy);
          parent.setSize(width, newH);
          break;
        }

        case ResizeTag.br: {
          const newW = Math.max(minW, width + dx);
          const newH = Math.max(minH, height + dy);
          parent.setSize(newW, newH);
          break;
        }
      }
    };
    const onUp = (ev: MouseEvent) => {
      const newRect = { ...parent.getRect() };
      const action: Action = {
        undo() {
          parent.setPosition(oldRect.x, oldRect.y);
          parent.setSize(oldRect.width, oldRect.height);
        },
        redo() {
          parent.setPosition(newRect.x, newRect.y);
          parent.setSize(newRect.width, newRect.height);
        }
      };
      editor.actionManager.push(action);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('mouseleave', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('mouseleave', onUp);
  }

  getCursor() {
    // todo: 需要考虑父元素旋转
    switch (this.getTag()) {
      case 'tl':
        return 'nw-resize';
      case 'br':
        return 'se-resize';
      case 'tr':
        return 'ne-resize';
      case 'bl':
        return 'sw-resize';
      case 't':
        return 'n-resize';
      case 'b':
        return 's-resize';
      case 'l':
        return 'w-resize';
      case 'r':
        return 'e-resize';
    }
    return super.getCursor();
  }

  static BORDER_WIDTH = 1;
  static SIZE = 8;
  static BORDER_COLOR = '#0f8eff';
}
