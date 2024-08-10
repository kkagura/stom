import { EventEmitter, fillText, getDevicePixelRatio } from '@stom/shared';
import { Editor } from './editor';
import { CommonEvents } from './models';
import { EditorPlugin } from './plugin';

interface Events {
  [CommonEvents.REPAINT](): void;
}

export class Grid extends EventEmitter<Events> implements EditorPlugin<Events> {
  private gap = 20;

  constructor(private editor: Editor) {
    super();
  }

  onReady(): void {
    this.editor.viewportManager.on(CommonEvents.change, this.repaint);
  }

  repaint = () => {
    this.emit(CommonEvents.REPAINT);
  };

  paintRoot(ctx: CanvasRenderingContext2D): void {
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

  paintTop(ctx: CanvasRenderingContext2D): void {
    // todo: gap应该与缩放值联动？
    const gap = this.gap;
    const { x, y, width: viewWidth, height: viewHeight } = this.editor.viewportManager.getViewRect();
    const startX = Math.ceil(x / gap) * gap;
    const dpr = getDevicePixelRatio();
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    const size = 40 / dpr;
    const shortLength = 8 / dpr;
    const longLength = 10 / dpr;

    const width = this.editor.mainCanvas.width;
    const height = this.editor.mainCanvas.height;

    ctx.beginPath();
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, width * dpr, size);

    ctx.beginPath();
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, size, height);

    ctx.beginPath();
    ctx.moveTo(0, size);
    ctx.lineTo(width, size);
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;
    ctx.stroke();

    for (let i = startX; i <= x + viewWidth; i += gap) {
      ctx.beginPath();
      const p1 = this.editor.viewportManager.getViewPoint({ x: i, y });
      const isBigGap = i % (gap * 5) === 0;
      ctx.moveTo(p1.x, p1.y + size);
      ctx.lineTo(p1.x, p1.y + size - (isBigGap ? longLength : shortLength));
      ctx.strokeStyle = isBigGap ? '#666' : 'transparent';
      ctx.stroke();

      if (isBigGap) {
        const rectWidth = gap * 5;
        const rectHeight = size - longLength;
        fillText(ctx, { x: p1.x - rectWidth / 2, y: p1.y, width: rectWidth, height: rectHeight }, `${i}`, {
          color: '#666',
          fontFamily: 'Arial',
          fontSize: rectHeight - 4,
          lineHeight: 1.5
        });
      }
    }

    ctx.beginPath();
    ctx.moveTo(size, 0);
    ctx.lineTo(size, height);
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;
    ctx.stroke();

    const startY = Math.ceil(y / gap) * gap;
    for (let i = startY; i <= y + viewHeight; i += gap) {
      ctx.beginPath();
      const p1 = this.editor.viewportManager.getViewPoint({ x, y: i });
      const isBigGap = i % (gap * 5) === 0;
      ctx.moveTo(p1.x + size, p1.y);
      ctx.lineTo(p1.x + size - (isBigGap ? longLength : shortLength), p1.y);
      ctx.strokeStyle = isBigGap ? '#666' : 'transparent';
      ctx.stroke();
      if (isBigGap) {
        const rectWidth = gap * 5;
        const rectHeight = size - longLength;
        ctx.save();
        const center = { x: p1.x + rectHeight / 2, y: p1.y };
        ctx.translate(center.x, center.y);
        ctx.rotate(-Math.PI / 2);
        ctx.translate(-center.x, -center.y);
        fillText(ctx, { x: p1.x + rectHeight / 2 - rectWidth / 2, y: p1.y - rectHeight / 2, width: rectWidth, height: rectHeight }, `${i}`, {
          color: '#666',
          fontFamily: 'Arial',
          fontSize: rectHeight - 4,
          lineHeight: 1.5
        });
        ctx.fill();
        ctx.restore();
      }
    }

    ctx.beginPath();
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, size, size);

    ctx.restore();
  }

  dispose() {
    this.clear();
    this.editor.viewportManager.off(CommonEvents.change, this.repaint);
  }
}
