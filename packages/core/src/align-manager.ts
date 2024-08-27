import { calcRectBbox, getPointsBbox, getRectByPoints, IBox, IMatrixArr, IPoint, IRect, Matrix, mergeBoxes, rectToVertices } from '@stom/geo';
import { Editor } from './editor';
import { CommonEvents, Model } from './models';
import { cloneDeep, EventEmitter } from '@stom/shared';
import { EditorPlugin } from './plugin';

export enum AlignDir {
  TOP = 'top',
  RIGHT = 'right',
  BOTTOM = 'bottom',
  LEFT = 'left',
  VERTICAL_CENTER = 'verticalCenter',
  HORIZONTAL_CENTER = 'horizontalCenter'
}

interface Events {
  [CommonEvents.REPAINT](): void;
}

export class AlignManager extends EventEmitter<Events> implements EditorPlugin<Events> {
  constructor(public editor: Editor) {
    super();
  }

  align(models: Model[], alignDir: AlignDir) {
    const bboxes = models.map(item => item.getBoundingBox());
    const positions = models.map(item => item.getPosition());
    const mixedBBox = mergeBoxes(bboxes);

    let changed = false;
    switch (alignDir) {
      case AlignDir.TOP:
        changed = this.alignTop(models, mixedBBox, bboxes);
        break;
      case AlignDir.RIGHT:
        changed = this.alignRight(models, mixedBBox, bboxes);
        break;
      case AlignDir.BOTTOM:
        changed = this.alignBottom(models, mixedBBox, bboxes);
        break;
      case AlignDir.LEFT:
        changed = this.alignLeft(models, mixedBBox, bboxes);
        break;
      case AlignDir.HORIZONTAL_CENTER:
        changed = this.alignHorizontalCenter(models, mixedBBox, bboxes);
        break;
      case AlignDir.VERTICAL_CENTER:
        changed = this.alignVerticalCenter(models, mixedBBox, bboxes);
        break;
    }
    if (changed) {
      const newPositions = models.map(item => item.getPosition());
      const action = {
        undo: () => {
          models.forEach((model, i) => {
            const oldPosition = positions[i];
            model.setPosition(oldPosition.x, oldPosition.y);
          });
        },
        redo: () => {
          models.forEach((model, i) => {
            const newPosition = newPositions[i];
            model.setPosition(newPosition.x, newPosition.y);
          });
        }
      };
      this.editor.actionManager.push(action);
    }
  }

  private alignTop(models: Model[], mixedBBox: IBox, bboxes: IBox[]) {
    let changed = false;
    models.forEach((model, i) => {
      const dy = mixedBBox.minY - bboxes[i].minY;
      if (dy === 0) {
        return;
      }
      changed = true;
      this.updateModel(model, 0, dy);
    });
    return changed;
  }

  private alignBottom(models: Model[], mixedBBox: IBox, bboxes: IBox[]) {
    let changed = false;
    models.forEach((model, i) => {
      const dy = mixedBBox.maxY - bboxes[i].maxY;
      if (dy === 0) {
        return;
      }
      changed = true;
      this.updateModel(model, 0, dy);
    });
    return changed;
  }

  private alignLeft(models: Model[], mixedBBox: IBox, bboxes: IBox[]) {
    let changed = false;
    models.forEach((model, i) => {
      const dx = mixedBBox.minX - bboxes[i].minX;
      if (dx === 0) {
        return;
      }
      changed = true;
      this.updateModel(model, dx, 0);
    });
    return changed;
  }

  private alignRight(models: Model[], mixedBBox: IBox, bboxes: IBox[]) {
    let changed = false;
    models.forEach((model, i) => {
      const dx = mixedBBox.maxX - bboxes[i].maxX;
      if (dx === 0) {
        return;
      }
      changed = true;
      this.updateModel(model, dx, 0);
    });
    return changed;
  }

  private alignVerticalCenter(models: Model[], mixedBBox: IBox, bboxes: IBox[]) {
    let changed = false;
    const centerY = mixedBBox.minY / 2 + mixedBBox.maxY / 2;
    models.forEach((model, i) => {
      const dy = centerY - (bboxes[i].minY / 2 + bboxes[i].maxY / 2);
      if (dy === 0) {
        return;
      }
      changed = true;
      this.updateModel(model, 0, dy);
    });
    return changed;
  }

  private alignHorizontalCenter(models: Model[], mixedBBox: IBox, bboxes: IBox[]) {
    let changed = false;
    const centerX = mixedBBox.minX / 2 + mixedBBox.maxX / 2;
    models.forEach((model, i) => {
      const dx = centerX - (bboxes[i].minX / 2 + bboxes[i].maxX / 2);
      if (dx === 0) {
        return;
      }
      changed = true;
      this.updateModel(model, dx, 0);
    });
    return changed;
  }

  private updateModel(model: Model, dx: number, dy: number) {
    // 判断是否改变
    const oldPos = model.getPosition();
    model.setPosition(oldPos.x + dx, oldPos.y + dy);
  }

  measure(targetRect: IRect, others: IRect[]) {}

  private measureVertical(targetRect: IRect, others: IRect[]) {}

  private measureHorizontal(targetRect: IRect, others: IRect[]) {}

  paintRoot(ctx: CanvasRenderingContext2D): void {}

  paintTop(ctx: CanvasRenderingContext2D): void {}

  dispose() {
    this.clear();
  }
}
