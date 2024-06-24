import { EventEmitter, arrayRemove } from '@stom/shared';
import { Model, ModelEvents } from './models';
import { Editor, EditorPlugin } from './editor';
import { BoxEvents } from './box';
import { IRect, extendRect, mergeRects } from '@stom/geo';

export enum SelectionEvents {
  change = 'change',
  setSelection = 'setSelection',
  clearSelection = 'clearSelection',
  addSelection = 'addSelection',
  removeSelection = 'removeSelection'
}

interface Events {
  [SelectionEvents.change]: () => void;
  [SelectionEvents.setSelection]: (models: Model[]) => void;
  [SelectionEvents.clearSelection]: () => void;
  [SelectionEvents.addSelection]: (model: Model) => void;
  [SelectionEvents.removeSelection]: (model: Model) => void;
}

export class SelectionManager extends EventEmitter<Events> implements EditorPlugin {
  private selection: Model[] = [];
  private containRect: IRect | null = null;
  constructor(private editor: Editor) {
    super();
    editor.box.on(BoxEvents.removeModels, models => {
      models.forEach(model => {
        if (this.isSelected(model)) {
          this.removeSelection(model);
        }
      });
    });
    this.on(SelectionEvents.change, this.caculateContainRect);
  }

  private _addSelection(model: Model) {
    model.on(ModelEvents.renderRectChange, this.caculateContainRect);
    model.emit(ModelEvents.selected);
    this.selection.push(model);
  }

  private _removeSelection(model: Model) {
    model.off(ModelEvents.renderRectChange, this.caculateContainRect);
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
    this.emit(SelectionEvents.change);
  }

  addSelection(model: Model) {
    if (this.isSelected(model)) return;
    this._addSelection(model);
    this.emit(SelectionEvents.addSelection, model);
    this.emit(SelectionEvents.change);
  }

  removeSelection(model: Model) {
    if (!this.isSelected(model)) return;
    this._removeSelection(model);
    this.emit(SelectionEvents.removeSelection, model);
    this.emit(SelectionEvents.change);
  }

  clearSelection() {
    if (!this.selection.length) return;
    this._clearSelection();
    this.emit(SelectionEvents.clearSelection);
    this.emit(SelectionEvents.change);
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
  };

  getSelectionList() {
    return this.selection;
  }

  paint(ctx: CanvasRenderingContext2D): void {
    if (this.containRect) {
      ctx.beginPath();
      ctx.roundRect(this.containRect.x, this.containRect.y, this.containRect.width, this.containRect.height, 2);
      ctx.strokeStyle = SelectionManager.SELECTION_STROKE_COLOR;
      ctx.lineWidth = 2;
      ctx.setLineDash(SelectionManager.SELECTION_LINE_DASH);
      ctx.stroke();
    }
  }

  static SELECTION_STROKE_COLOR = '#0f8eff';
  static SELECTION_LINE_DASH = [5, 5];
}
