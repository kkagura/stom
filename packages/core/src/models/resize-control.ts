import { IMatrixArr, IRect, Matrix, ResizeDirs, invertMatrix, isPointInRect, multiplyMatrix, recomputeTransformRect, resizeRect } from '@stom/geo';
import { Control, ControlEvents } from './control';
import { Action } from '../action-manager';
import { Editor } from '../editor';
import { CommonEvents } from './common-events';
import { SelectionManager } from '../selection-manager';

export class ResizeControl extends Control<SelectionManager> {
  constructor(host: SelectionManager, tag: ResizeDirs) {
    super(host, tag);
  }
  init() {
    this.setSize(ResizeControl.SIZE, ResizeControl.SIZE);
  }

  updatePosition() {
    const rect = this.getHost().getRect();
    if (!rect || rect.width === 0 || rect.height === 0) return;
    const { width, height } = rect;
    const halfAttWidth = ResizeControl.SIZE / 2;
    const tag = this.getTag();
    if (tag === ResizeDirs.nw) {
      this.setPosition(0 - halfAttWidth, 0 - halfAttWidth);
    } else if (tag === ResizeDirs.ne) {
      this.setPosition(width - halfAttWidth, 0 - halfAttWidth);
    } else if (tag === ResizeDirs.sw) {
      this.setPosition(0 - halfAttWidth, height - halfAttWidth);
    } else if (tag === ResizeDirs.se) {
      this.setPosition(width - halfAttWidth, height - halfAttWidth);
    } else if (tag === ResizeDirs.n) {
      this.setPosition(width / 2 - halfAttWidth, 0 - halfAttWidth);
    } else if (tag === ResizeDirs.e) {
      this.setPosition(width - halfAttWidth, height / 2 - halfAttWidth);
    } else if (tag === ResizeDirs.w) {
      this.setPosition(0 - halfAttWidth, height / 2 - halfAttWidth);
    } else if (tag === ResizeDirs.s) {
      this.setPosition(width / 2 - halfAttWidth, height - halfAttWidth);
    }
  }

  paint(ctx: CanvasRenderingContext2D): void {
    const rect = this.getRect();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.width, rect.height);
    ctx.fillStyle = ctx.fillStyle = this.getIsHovered() ? ResizeControl.BORDER_COLOR : '#fff';
    ctx.fill();
    ctx.setLineDash([]);
    ctx.strokeStyle = ResizeControl.BORDER_COLOR;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  hitTest(x: number, y: number): boolean {
    const rect = this.getHost().getRect();
    x -= rect.x;
    y -= rect.y;
    return isPointInRect({ x, y }, this.getRect(), ResizeControl.BORDER_WIDTH);
  }

  handleMousedown(e: MouseEvent, editor: Editor) {
    this.emit(ControlEvents.mouseDown, e);
    const selectionManager = this.getHost();
    const selectionList = selectionManager.getSelectionList();
    const originTransformMap = new Map<string, IMatrixArr>();
    const originRectMap = new Map<string, IRect>();
    selectionList.forEach(el => {
      originTransformMap.set(el.id, el.getWordTransform());
      originRectMap.set(el.id, { ...el.getRect() });
    });
    const { x, y, width, height } = selectionManager.getRect();
    const startSelectedBoxTf = new Matrix().translate(x, y);
    let lastPoint = { x: e.clientX, y: e.clientY };
    // todo 偏移问题待解决
    const onMove = (ev: MouseEvent) => {
      const currPoint = { x: ev.clientX, y: ev.clientY };
      if (currPoint.x === lastPoint.x && currPoint.y === lastPoint.y) return;
      const gloalPt = editor.viewportManager.getScenePoint(currPoint);
      lastPoint = currPoint;
      const transformRect = resizeRect(this.getTag() as ResizeDirs, gloalPt, { width, height, transform: startSelectedBoxTf.getArray() });
      const prependedTransform = new Matrix(...transformRect.transform).append(startSelectedBoxTf.clone().invert());
      selectionList.forEach(el => {
        const originWorldTf = originTransformMap.get(el.id)!;
        const newWorldTf = multiplyMatrix(prependedTransform.getArray(), originWorldTf);
        const newLocalTf = multiplyMatrix(invertMatrix([1, 0, 0, 1, 0, 0]), newWorldTf);
        const { width, height } = originRectMap.get(el.id)!;
        const newAttrs = recomputeTransformRect({
          width,
          height,
          transform: newLocalTf
        });
        el.setSize(newAttrs.width, newAttrs.height);
        el.setWordTransform(newAttrs.transform);
      });
    };
    const onUp = () => {
      // todo: actionManager
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }

  handleMousedown11(e: MouseEvent, editor: Editor) {
    this.emit(ControlEvents.mouseDown, e);
    const zoom = editor.viewportManager.getZoom();
    const startX = e.clientX,
      startY = e.clientY;
    let lastX = startX,
      lastY = startY;
    const host = this.getHost();
    const tag = this.getTag();
    const oldRect = { ...host.getRect() };
    const onMove = (ev: MouseEvent) => {
      // const cx = ev.clientX,
      //   cy = ev.clientY;
      // const dx = (cx - lastX) / zoom,
      //   dy = (cy - lastY) / zoom;
      // lastX = cx;
      // lastY = cy;
      // const { x, y, width, height } = host.getRect();
      // const minW = host.getMinWidth();
      // const minH = host.getMinHeight();
      // switch (tag) {
      //   case ResizeDirs.tl: {
      //     const newW = Math.max(minW, width - dx);
      //     const newH = Math.max(minH, height - dy);
      //     const offsetX = newW - width;
      //     const offsetY = newH - height;
      //     parent.setPosition(x - offsetX, y - offsetY);
      //     parent.setSize(newW, newH);
      //     break;
      //   }
      //   case ResizeDirs.tr: {
      //     const newW = Math.max(minW, width + dx);
      //     const newH = Math.max(minH, height - dy);
      //     const offsetY = newH - height;
      //     parent.setPosition(x, y - offsetY);
      //     parent.setSize(newW, newH);
      //     break;
      //   }
      //   case ResizeDirs.t: {
      //     const newH = Math.max(minH, height - dy);
      //     const offsetY = newH - height;
      //     parent.setPosition(x, y - offsetY);
      //     parent.setSize(width, newH);
      //     break;
      //   }
      //   case ResizeDirs.l: {
      //     const newW = Math.max(minW, width - dx);
      //     const offsetX = newW - width;
      //     parent.setPosition(x - offsetX, y);
      //     parent.setSize(newW, height);
      //     break;
      //   }
      //   case ResizeDirs.r: {
      //     const newW = Math.max(minW, width + dx);
      //     parent.setSize(newW, height);
      //     break;
      //   }
      //   case ResizeDirs.bl: {
      //     const newW = Math.max(minW, width - dx);
      //     const newH = Math.max(minH, height + dy);
      //     const offsetX = newW - width;
      //     parent.setPosition(x - offsetX, y);
      //     parent.setSize(newW, newH);
      //     break;
      //   }
      //   case ResizeDirs.b: {
      //     const newH = Math.max(minH, height + dy);
      //     parent.setSize(width, newH);
      //     break;
      //   }
      //   case ResizeDirs.br: {
      //     const newW = Math.max(minW, width + dx);
      //     const newH = Math.max(minH, height + dy);
      //     parent.setSize(newW, newH);
      //     break;
      //   }
      // }
    };
    const onUp = (e: MouseEvent) => {
      this.emit(ControlEvents.mouseUp, e);
      // 修改isMoving之后需要手动触发一下父元素的重绘
      host.emit(CommonEvents.change);
      const newRect = { ...host.getRect() };
      const action: Action = {
        undo() {
          host.setPosition(oldRect.x, oldRect.y);
          host.setSize(oldRect.width, oldRect.height);
        },
        redo() {
          host.setPosition(newRect.x, newRect.y);
          host.setSize(newRect.width, newRect.height);
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
    return `${this.getTag()}-resize`;
  }

  static BORDER_WIDTH = 1;
  static SIZE = 8;
  static BORDER_COLOR = '#0f8eff';
}
