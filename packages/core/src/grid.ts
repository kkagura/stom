import { EventEmitter } from '@stom/shared';
import { Editor } from './editor';
import { CommonEvents } from './models';
import { EditorPlugin } from './plugin';

interface Events {
  [CommonEvents.REPAINT](): void;
}

export class Grid extends EventEmitter<Events> implements EditorPlugin<Events> {
  private gap = 20;

  private dirty = true;

  constructor(private editor: Editor) {
    super();
    editor.viewportManager.on(CommonEvents.change, this.repaint);
  }

  repaint = () => {
    this.emit(CommonEvents.REPAINT);
  };

  paint(ctx: CanvasRenderingContext2D): void {
    if (!this.dirty) return;
    const gap = this.gap;
    const { x, y, width, height } = this.editor.viewportManager.getViewRect();
    const startX = Math.ceil(x / gap) * gap;
    for (let i = startX; i <= x + width; i += gap) {
      ctx.beginPath();
      ctx.moveTo(i, y);
      ctx.lineTo(i, y + height);
      ctx.lineWidth = 1;
      ctx.strokeStyle = i % (gap * 5) === 0 ? '#ddd' : '#eee';
      ctx.stroke();
    }
    const startY = Math.ceil(y / gap) * gap;
    for (let i = startY; i <= y + height; i += gap) {
      ctx.beginPath();
      ctx.moveTo(x, i);
      ctx.lineTo(x + width, i);
      ctx.lineWidth = 1;
      ctx.strokeStyle = i % (gap * 5) === 0 ? '#ddd' : '#eee';
      ctx.stroke();
    }
  }

  dispose() {
    this.clear();
    this.editor.viewportManager.off(CommonEvents.change, this.repaint);
  }
}
