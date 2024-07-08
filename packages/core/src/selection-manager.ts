import { EventEmitter, arrayRemove } from '@stom/shared';
import { Model, ModelEvents } from './models';
import { Editor } from './editor';
import { BoxEvents } from './box';
import { IMatrixArr, IPoint, IRect, Matrix, ResizeDirs, boxToRect, calcRectBbox, extendRect, isPointInRect, mergeBoxes, mergeRects } from '@stom/geo';
import { CommonEvents } from './models/common-events';
import { ResizeControl } from './models/resize-control';
import { RotateControl } from './models/rotate-control';
import { Control } from './models/control';
import { EditorPlugin } from './plugin';

export enum SelectionEvents {
  setSelection = 'setSelection',
  clearSelection = 'clearSelection',
  addSelection = 'addSelection',
  removeSelection = 'removeSelection'
}

interface Events {
  [CommonEvents.change]: () => void;
  [CommonEvents.rectChange]: () => void;
  [CommonEvents.REPAINT](): void;
  [SelectionEvents.setSelection]: (models: Model[]) => void;
  [SelectionEvents.clearSelection]: () => void;
  [SelectionEvents.addSelection]: (model: Model) => void;
  [SelectionEvents.removeSelection]: (model: Model) => void;
}

export class SelectionManager extends EventEmitter<Events> implements EditorPlugin<Events> {
  private selection: Model[] = [];
  private rect: IRect = { x: 0, y: 0, height: 0, width: 0 };
  private resizers: ResizeControl[] = [];
  private rotator: RotateControl = new RotateControl(this);
  private pauseUpdateRect: boolean = false;
  private rotate: number = 0;
  private activeControl: Control | null = null;
  constructor(private editor: Editor) {
    super();
    editor.box.on(BoxEvents.removeModels, models => {
      models.forEach(model => {
        if (this.isSelected(model)) {
          this.removeSelection(model);
        }
      });
    });
    this.initResizers();
    this.rotator.on(CommonEvents.change, this.repaint);
    this.on(CommonEvents.change, this.caculateContainRect);
  }

  initResizers() {
    this.resizers = Object.values(ResizeDirs).map(tag => new ResizeControl(this, tag));
    this.resizers.forEach(el => {
      el.on(CommonEvents.change, this.repaint);
    });
  }

  repaint = () => {
    this.emit(CommonEvents.REPAINT);
  };

  private _addSelection(model: Model) {
    model.on(CommonEvents.rectChange, this.caculateContainRect);
    model.emit(ModelEvents.selected);
    this.selection.push(model);
  }

  private _removeSelection(model: Model) {
    model.off(CommonEvents.rectChange, this.caculateContainRect);
    model.emit(ModelEvents.unselected);
    arrayRemove(this.selection, model);
  }

  private _clearSelection() {
    for (let i = this.selection.length - 1; i >= 0; i--) {
      this._removeSelection(this.selection[i]);
    }
  }

  setSelection(models: Model[]) {
    this._clearSelection();
    models.forEach(m => this._addSelection(m));
    this.emit(SelectionEvents.setSelection, models);
    this.emit(CommonEvents.change);
  }

  addSelection(model: Model) {
    if (this.isSelected(model)) return;
    this._addSelection(model);
    this.emit(SelectionEvents.addSelection, model);
    this.emit(CommonEvents.change);
  }

  removeSelection(model: Model) {
    if (!this.isSelected(model)) return;
    this._removeSelection(model);
    this.emit(SelectionEvents.removeSelection, model);
    this.emit(CommonEvents.change);
  }

  clearSelection() {
    if (!this.selection.length) return;
    this._clearSelection();
    this.emit(SelectionEvents.clearSelection);
    this.emit(CommonEvents.change);
  }

  toggleSelection(model: Model) {
    if (this.isSelected(model)) {
      this.removeSelection(model);
    } else {
      this.addSelection(model);
    }
  }

  isSelected(model) {
    return this.selection.includes(model);
  }

  togglePauseUpdateRect(bool: boolean) {
    this.pauseUpdateRect = bool;
  }

  caculateContainRect = () => {
    if (this.pauseUpdateRect) return;
    if (this.selection.length === 1) {
      this.rect = this.selection[0].getRect();
    } else if (this.selection.length > 1) {
      const bboxes = this.selection.map(el => el.getBoundingBox());
      this.rect = boxToRect(mergeBoxes(bboxes));
    } else {
      this.rect = { x: 0, width: 0, height: 0, y: 0 };
    }
    this.emit(CommonEvents.rectChange);
    this.repaint();
  };

  getRenderRect() {
    const rect = this.getBoundingRect();
    const ans = extendRect(rect, RotateControl.SIZE);
    return ans;
  }

  getBoundingRect(): IRect {
    const rect = this.getRect();
    if (this.selection.length === 1) {
      const box = calcRectBbox({
        ...rect,
        transform: this.getWorldTransform()
      });
      return boxToRect(box);
    } else {
      return rect;
    }
  }

  getSelectionList() {
    return [...this.selection];
  }

  getRect(): IRect {
    return this.rect;
  }

  setPosition(x: number, y: number): void {}

  move(dx: number, dy: number): void {
    this.selection.forEach(el => {
      el.move(dx, dy);
    });
  }

  setRotate(dRotation: number) {
    this.rotate = dRotation;
    this.repaint();
  }

  getWorldTransform(): IMatrixArr {
    if (this.selection.length === 1) {
      return this.selection[0].getWorldTransform();
    }
    const { x, y } = this.rect || { x: 0, y: 0 };
    return [1, 0, 0, 1, x, y];
  }

  paintTop(ctx: CanvasRenderingContext2D): void {
    if (this.selection.length > 0) {
      ctx.save();
      const { width, height } = this.rect;
      const transform = this.getWorldTransform();
      ctx.transform(...transform);
      if (this.selection.length > 1) {
        // todo 考虑通过transform处理
        if (this.rotate) {
          ctx.translate(width / 2, height / 2);
          ctx.rotate(this.rotate);
          ctx.translate(-(width / 2), -(height / 2));
        }
      }
      ctx.beginPath();
      ctx.roundRect(0, 0, width, height, 2);
      ctx.strokeStyle = SelectionManager.SELECTION_STROKE_COLOR;
      ctx.lineWidth = 2;
      ctx.setLineDash(SelectionManager.SELECTION_LINE_DASH);
      ctx.stroke();
      ctx.translate(0, 0);
      this.resizers.forEach(resizer => {
        resizer.updatePosition();
        resizer.paint(ctx);
      });
      this.rotator.updatePosition();
      this.rotator.paint(ctx);

      ctx.restore();

      // ctx.beginPath();
      // const r = this.getRenderRect();
      // ctx.strokeRect(r.x, r.y, r.width, r.height);
    }
  }

  paintRoot(ctx: CanvasRenderingContext2D): void {}

  getControlAt(p: IPoint) {
    if (this.selection.length === 0) return;
    const rect = this.getRenderRect();
    if (!isPointInRect(p, rect)) return;

    const resizer = this.resizers.find(r => r.hitTest(p.x, p.y));
    if (resizer) return resizer;
    if (this.rotator.hitTest(p.x, p.y)) return this.rotator;
  }

  getActiveControl() {
    return this.activeControl;
  }

  setActiveControl(activeControl: Control) {
    if (activeControl === this.activeControl) return;
    this.activeControl = activeControl;
    this.emit(CommonEvents.change);
  }

  dispose() {
    this.clear();
    this.editor.box.off(BoxEvents.removeModels, models => {
      models.forEach(model => {
        if (this.isSelected(model)) {
          this.removeSelection(model);
        }
      });
    });
    this.resizers.forEach(r => r.dispose());
    this.rotator.dispose();
  }

  static SELECTION_STROKE_COLOR = '#0f8eff';
  static SELECTION_LINE_DASH = [5, 5];
}
