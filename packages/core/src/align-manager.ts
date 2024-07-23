import { IBox, IMatrixArr, mergeBoxes } from '@stom/geo';
import { Editor } from './editor';
import { Model } from './models';
import { cloneDeep } from '@stom/shared';

export enum AlignDir {
  TOP = 'top',
  RIGHT = 'right',
  BOTTOM = 'bottom',
  LEFT = 'left',
  VERTICAL_CENTER = 'verticalCenter',
  HORIZONTAL_CENTER = 'horizontalCenter'
}

export class AlignManager {
  constructor(public editor: Editor) {}

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
    }
    if (changed) {
      const newWorldTfs = models.map(item => item.getWorldTransform());
      const action = {
        undo: () => {
          models.forEach((model, i) => {
            model.setWorldTransform(worldTfs[i]);
          });
        },
        redo: () => {
          models.forEach((model, i) => {
            model.setWorldTransform(newWorldTfs[i]);
          });
        }
      };
      this.editor.actionManager.push(action);
    }
  }

  alignTop(models: Model[], mixedBBox: IBox, bboxes: IBox[], worldTfs: IMatrixArr[]) {
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

  alignBottom(models: Model[], mixedBBox: IBox, bboxes: IBox[], worldTfs: IMatrixArr[]) {
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

  alignLeft(models: Model[], mixedBBox: IBox, bboxes: IBox[], worldTfs: IMatrixArr[]) {
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

  alignRight(models: Model[], mixedBBox: IBox, bboxes: IBox[], worldTfs: IMatrixArr[]) {
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

  private updateModel(model: Model, worldTf: IMatrixArr, dx: number, dy: number) {
    const newWorldTf = cloneDeep(worldTf);
    newWorldTf[4] += dx;
    newWorldTf[5] += dy;
    model.setWorldTransform(newWorldTf);
  }
}
