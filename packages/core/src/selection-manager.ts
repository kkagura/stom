import { EventEmitter, arrayRemove } from '@stom/shared';
import { Model, ModelEvents } from './models';
import { Editor, EditorPlugin } from './editor';
import { BoxEvents } from './box';
import { IPoint, IRect, ResizeDirs, extendRect, isPointInRect, mergeRects } from '@stom/geo';
import { CommonEvents } from './models/common-events';
import { ResizeControl } from './models/resize-control';

export enum SelectionEvents {
  setSelection = 'setSelection',
  clearSelection = 'clearSelection',
  addSelection = 'addSelection',
  removeSelection = 'removeSelection'
}

interface Events {
  [CommonEvents.change]: () => void;
  [CommonEvents.rectChange]: () => void;
  [SelectionEvents.setSelection]: (models: Model[]) => void;
  [SelectionEvents.clearSelection]: () => void;
  [SelectionEvents.addSelection]: (model: Model) => void;
  [SelectionEvents.removeSelection]: (model: Model) => void;
}

export class SelectionManager extends EventEmitter<Events> implements EditorPlugin {
  private selection: Model[] = [];
  private containRect: IRect | null = null;
  private resizers: ResizeControl[] = [];
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
    this.on(CommonEvents.change, this.caculateContainRect);
  }

  initResizers() {
    this.resizers = Object.values(ResizeDirs).map(tag => new ResizeControl(this, tag));
  }

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

  caculateContainRect = () => {
    if (this.selection.length) {
      const rects = this.selection.map(m => m.getRenderRect());
      const box = mergeRects(...rects);
      this.containRect = extendRect(box, 10);
    } else {
      this.containRect = null;
    }
    this.emit(CommonEvents.rectChange);
  };

  getSelectionList() {
    return this.selection;
  }

  getRect(): IRect {
    return this.containRect!;
  }

  onMoveStart() {}

  onMoveEnd() {}

  setPosition(x: number, y: number): void {}

  move(dx: number, dy: number): void {
    this.selection.forEach(el => {
      el.move(dx, dy);
    });
  }

  setSize(w: number, h: number): void {}

  changeSize(dw: number, dh: number) {
    return {
      dx: 0,
      dy: 0
    };
  }

  getMinWidth(): number {
    return 100;
  }

  getMinHeight(): number {
    return 100;
  }

  paint(ctx: CanvasRenderingContext2D): void {
    if (this.containRect) {
      ctx.beginPath();
      const { x, y, width, height } = this.containRect;
      ctx.roundRect(x, y, width, height, 2);
      ctx.strokeStyle = SelectionManager.SELECTION_STROKE_COLOR;
      ctx.lineWidth = 2;
      ctx.setLineDash(SelectionManager.SELECTION_LINE_DASH);
      ctx.stroke();

      ctx.save();
      ctx.translate(x, y);
      this.resizers.forEach(resizer => {
        resizer.updatePosition();
        resizer.paint(ctx);
      });
      ctx.restore();
    }
  }

  getControlAt(point: IPoint) {
    if (!this.containRect) return;
    const rect = this.containRect;
    const halfAttWidth = ResizeControl.SIZE / 2 + ResizeControl.BORDER_WIDTH;
    if (isPointInRect(point, rect, halfAttWidth)) {
      const resizer = this.resizers.find(r => r.hitTest(point.x, point.y));
      return resizer || null;
    }
    return null;
  }

  static SELECTION_STROKE_COLOR = '#0f8eff';
  static SELECTION_LINE_DASH = [5, 5];
}
