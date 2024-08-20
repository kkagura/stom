import { IBox, IMatrixArr, mergeBoxes } from '@stom/geo';
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

  // todo: 修复因为重构transform导致的对齐问题
  align(models: Model[], alignDir: AlignDir) {
    const bboxes = models.map(item => item.getBoundingBox());
    const worldTfs = models.map(item => item.getWorldTransform());
    const mixedBBox = mergeBoxes(bboxes);

    let changed = false;
    switch (alignDir) {
      case AlignDir.TOP:
        changed = this.alignTop(models, mixedBBox, bboxes, worldTfs);
        break;
      case AlignDir.RIGHT:
        changed = this.alignRight(models, mixedBBox, bboxes, worldTfs);
        break;
      case AlignDir.BOTTOM:
        changed = this.alignBottom(models, mixedBBox, bboxes, worldTfs);
        break;
      case AlignDir.LEFT:
        changed = this.alignLeft(models, mixedBBox, bboxes, worldTfs);
        break;
      case AlignDir.HORIZONTAL_CENTER:
        changed = this.alignHorizontalCenter(models, mixedBBox, bboxes, worldTfs);
        break;
      case AlignDir.VERTICAL_CENTER:
        changed = this.alignVerticalCenter(models, mixedBBox, bboxes, worldTfs);
        break;
    }
    if (changed) {
      const newWorldTfs = models.map(item => item.getWorldTransform());
      const action = {
        undo: () => {
          models.forEach((model, i) => {
            const worldTf = worldTfs[i];
            model.setPosition(worldTf[4], worldTf[5]);
          });
        },
        redo: () => {
          models.forEach((model, i) => {
            const newWorldTf = newWorldTfs[i];
            model.setPosition(newWorldTf[4], newWorldTf[5]);
          });
        }
      };
      this.editor.actionManager.push(action);
    }
  }

  private alignTop(models: Model[], mixedBBox: IBox, bboxes: IBox[], worldTfs: IMatrixArr[]) {
    let changed = false;
    models.forEach((model, i) => {
      const dy = mixedBBox.minY - bboxes[i].minY;
      if (dy === 0) {
        return;
      }
      changed = true;
      this.updateModel(model, worldTfs[i], 0, dy);
    });
    return changed;
  }

  private alignBottom(models: Model[], mixedBBox: IBox, bboxes: IBox[], worldTfs: IMatrixArr[]) {
    let changed = false;
    models.forEach((model, i) => {
      const dy = mixedBBox.maxY - bboxes[i].maxY;
      if (dy === 0) {
        return;
      }
      changed = true;
      this.updateModel(model, worldTfs[i], 0, dy);
    });
    return changed;
  }

  private alignLeft(models: Model[], mixedBBox: IBox, bboxes: IBox[], worldTfs: IMatrixArr[]) {
    let changed = false;
    models.forEach((model, i) => {
      const dx = mixedBBox.minX - bboxes[i].minX;
      if (dx === 0) {
        return;
      }
      changed = true;
      this.updateModel(model, worldTfs[i], dx, 0);
    });
    return changed;
  }

  private alignRight(models: Model[], mixedBBox: IBox, bboxes: IBox[], worldTfs: IMatrixArr[]) {
    let changed = false;
    models.forEach((model, i) => {
      const dx = mixedBBox.maxX - bboxes[i].maxX;
      if (dx === 0) {
        return;
      }
      changed = true;
      this.updateModel(model, worldTfs[i], dx, 0);
    });
    return changed;
  }

  private alignVerticalCenter(models: Model[], mixedBBox: IBox, bboxes: IBox[], worldTfs: IMatrixArr[]) {
    let changed = false;
    const centerY = mixedBBox.minY / 2 + mixedBBox.maxY / 2;
    models.forEach((model, i) => {
      const dy = centerY - (bboxes[i].minY / 2 + bboxes[i].maxY / 2);
      if (dy === 0) {
        return;
      }
      changed = true;
      this.updateModel(model, worldTfs[i], 0, dy);
    });
    return changed;
  }

  private alignHorizontalCenter(models: Model[], mixedBBox: IBox, bboxes: IBox[], worldTfs: IMatrixArr[]) {
    let changed = false;
    const centerX = mixedBBox.minX / 2 + mixedBBox.maxX / 2;
    models.forEach((model, i) => {
      const dx = centerX - (bboxes[i].minX / 2 + bboxes[i].maxX / 2);
      if (dx === 0) {
        return;
      }
      changed = true;
      this.updateModel(model, worldTfs[i], dx, 0);
    });
    return changed;
  }

  private updateModel(model: Model, worldTf: IMatrixArr, dx: number, dy: number) {
    const newWorldTf = cloneDeep(worldTf);
    newWorldTf[4] += dx;
    newWorldTf[5] += dy;
    model.setPosition(newWorldTf[4], newWorldTf[5]);
  }

  // todo: 辅助线
  paintRoot(ctx: CanvasRenderingContext2D): void {}

  paintTop(ctx: CanvasRenderingContext2D): void {}

  dispose() {
    this.clear();
  }
}
