import { IMatrixArr, IRect, Matrix, ResizeDirs, invertMatrix, isPointInRect, multiplyMatrix, recomputeTransformRect, resizeRect } from '@stom/geo';
import { Control } from './control';
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

  hitTest(x: number, y: number): boolean {
    return super.hitTest(x, y);
  }

  paint(ctx: CanvasRenderingContext2D): void {
    const rect = this.getRect();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.width, rect.height);
    ctx.fillStyle = ctx.fillStyle = this.getIsHovered() || this.getIsActive() ? ResizeControl.BORDER_COLOR : '#fff';
    ctx.fill();
    ctx.setLineDash([]);
    ctx.strokeStyle = ResizeControl.BORDER_COLOR;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  handleMousedown(e: MouseEvent, editor: Editor) {
    const selectionManager = this.getHost();
    const selectionList = selectionManager.getSelectionList().filter(el => el.getResizeable());
    if (selectionList.length === 0) return;
    const originTransformMap = new Map<string, IMatrixArr>();
    const originRectMap = new Map<string, IRect>();
    selectionList.forEach(el => {
      originTransformMap.set(el.id, el.getWorldTransform());
      originRectMap.set(el.id, el.getRect());
    });
    let { x, y, width, height } = selectionManager.getBoundingRect();
    const startSelectedBoxTf = new Matrix().translate(x, y);
    let lastPoint = editor.viewportManager.getCursorViewPoint(e);

    const updatedTransformMap = new Map<string, IMatrixArr>();
    const updatedRectMap = new Map<string, IRect>();

    useDragEvent(
      {
        onDragStart: () => {
          this.setIsActive(true);
        },
        onDragMove: ev => {
          const currPoint = editor.viewportManager.getCursorViewPoint(ev);
          if (currPoint.x === lastPoint.x && currPoint.y === lastPoint.y) return;
          const gloalPt = editor.viewportManager.getCursorScenePoint(ev);
          lastPoint = currPoint;

          let prependedTransform = new Matrix();

          if (selectionManager.getSelectionList().length === 1) {
            const originWorldTf = originTransformMap.get(selectionList[0].id)!;
            const originRect = originRectMap.get(selectionList[0].id)!;
            const updatedTransformRect = resizeRect(this.getTag() as ResizeDirs, gloalPt, {
              width: originRect.width,
              height: originRect.height,
              transform: originWorldTf
            });
            prependedTransform = new Matrix(...updatedTransformRect.transform).append(new Matrix(...originWorldTf).invert());
          } else {
            const transformRect = resizeRect(this.getTag() as ResizeDirs, gloalPt, {
              width,
              height,
              transform: startSelectedBoxTf.getArray()
            });
            prependedTransform = new Matrix(...transformRect.transform).append(startSelectedBoxTf.clone().invert());
          }

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
            const [, , , , dx, dy] = newAttrs.transform;
            el.setPosition(dx, dy);
            updatedTransformMap.set(el.id, el.getWorldTransform());
            updatedRectMap.set(el.id, el.getRect());
          });
        },
        onDragEnd: ev => {
          this.setIsActive(false);
          const action = {
            undo: () => {
              selectionList.forEach(el => {
                const { width, height, x, y } = originRectMap.get(el.id)!;
                el.setSize(width, height);
                el.setPosition(x, y);
              });
            },
            redo: () => {
              selectionList.forEach(el => {
                const { width, height, x, y } = updatedRectMap.get(el.id)!;
                el.setSize(width, height);
                el.setPosition(x, y);
              });
            }
          };
          editor.actionManager.push(action);
        }
      },
      e
    );
  }

  getCursor() {
    // todo: 需要考虑父元素旋转
    return `${this.getTag()}-resize`;
  }

  static BORDER_WIDTH = 1;
  static SIZE = 8;
  static BORDER_COLOR = '#0f8eff';
}
