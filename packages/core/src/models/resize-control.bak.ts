import {
  IMatrixArr,
  IPoint,
  IRect,
  Matrix,
  ResizeDirs,
  invertMatrix,
  isPointInRect,
  multiplyMatrix,
  recomputeTransformRect,
  resizeRect
} from '@stom/geo';
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
    const selRect = selectionManager.getBoundingRect();
    const startPoint = editor.viewportManager.getCursorScenePoint(e);

    const updatedTransformMap = new Map<string, IMatrixArr>();
    const updatedRectMap = new Map<string, IRect>();

    useDragEvent(
      {
        onDragStart: () => {
          this.setIsActive(true);
        },
        onDragMove: ev => {
          const currPoint = editor.viewportManager.getCursorScenePoint(ev);
          const newRect = this.getNewSelRect(startPoint, currPoint, selRect);
          const scaleX = newRect.width / selRect.width;
          const scaleY = newRect.height / selRect.height;
          selectionList.forEach(model => {
            const originRect = originRectMap.get(model.id)!;
            const newRect = this.resizeRect(originRect, scaleX, scaleY);
            model.setPosition(newRect.x, newRect.y);
            model.setSize(newRect.width, newRect.height);
          });
        },
        onDragEnd: ev => {
          this.setIsActive(false);
          const action = {
            undo: () => {
              selectionList.forEach(el => {
                const { width, height } = originRectMap.get(el.id)!;
                const originTransform = originTransformMap.get(el.id)!;
                el.setSize(width, height);
                el.setWorldTransform(originTransform);
              });
            },
            redo: () => {
              selectionList.forEach(el => {
                const { width, height } = updatedRectMap.get(el.id)!;
                const originTransform = updatedTransformMap.get(el.id)!;
                el.setSize(width, height);
                el.setWorldTransform(originTransform);
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

  getNewSelRect(startPoint: IPoint, endPoint: IPoint, { x, y, width, height }: IRect): IRect {
    const dir = this.getTag() as ResizeDirs;
    const minWidth = 20;
    const minHeight = 20;
    if (dir === ResizeDirs.e) {
      width = Math.max(minWidth, width + endPoint.x - startPoint.x);
    }
    return {
      x,
      y,
      width,
      height
    };
  }

  resizeRect({ x, y, width, height }: IRect, scaleX: number, scaleY: number): IRect {
    const dir = this.getTag() as ResizeDirs;
    if (dir === ResizeDirs.e) {
      width *= scaleX;
    }
    return { x, y, width, height };
  }

  static BORDER_WIDTH = 1;
  static SIZE = 8;
  static BORDER_COLOR = '#0f8eff';
}
