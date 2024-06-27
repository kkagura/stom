import { IMatrixArr, IRect, Matrix, ResizeDirs, invertMatrix, isPointInRect, multiplyMatrix, recomputeTransformRect, resizeRect } from '@stom/geo';
import { Control, ControlEvents } from './control';
import { Action } from '../action-manager';
import { Editor } from '../editor';
import { CommonEvents } from './common-events';
import { SelectionManager } from '../selection-manager';
import { useDragEvent } from '@stom/shared';

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
      originTransformMap.set(el.id, el.getWorldTransform());
      originRectMap.set(el.id, el.getRect());
    });
    let { x, y, width, height } = selectionManager.getBoundingRect();
    const startSelectedBoxTf = new Matrix().translate(x, y);
    let lastPoint = { x: e.offsetX, y: e.offsetY };

    useDragEvent({
      onDragMove: ev => {
        const currPoint = { x: ev.offsetX, y: ev.offsetY };
        if (currPoint.x === lastPoint.x && currPoint.y === lastPoint.y) return;
        const gloalPt = editor.viewportManager.getCursorScenePoint(ev);
        lastPoint = currPoint;
        const transformRect = resizeRect(
          this.getTag() as ResizeDirs,
          gloalPt,
          {
            width,
            height,
            transform: startSelectedBoxTf.getArray()
          },
          SelectionManager.SELECTION_PADDING
        );
        const prependedTransform = new Matrix(...transformRect.transform).append(startSelectedBoxTf.clone().invert());

        const prependedTransformArr = prependedTransform.getArray();
        selectionList.forEach(el => {
          const originWorldTf = originTransformMap.get(el.id)!;
          const newWorldTf = multiplyMatrix(prependedTransformArr, originWorldTf);
          const newLocalTf = multiplyMatrix(invertMatrix([1, 0, 0, 1, 0, 0]), newWorldTf);
          const { width, height } = originRectMap.get(el.id)!;
          const newAttrs = recomputeTransformRect({
            width,
            height,
            transform: newLocalTf
          });
          el.setSize(newAttrs.width, newAttrs.height);
          el.setWorldTransform(newAttrs.transform);
        });
      },
      onDragEnd: ev => {
        // todo: actionManager
      }
    });
  }

  getCursor() {
    // todo: 需要考虑父元素旋转
    return `${this.getTag()}-resize`;
  }

  static BORDER_WIDTH = 1;
  static SIZE = 8;
  static BORDER_COLOR = '#0f8eff';
}
