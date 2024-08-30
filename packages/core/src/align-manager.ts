import {
  calcRectBbox,
  getPointsBbox,
  getRectByPoints,
  IBox,
  ILineSegment,
  IMatrixArr,
  IPoint,
  IRect,
  isRectIntersect,
  Matrix,
  mergeBoxes,
  rectToVertices
} from '@stom/geo';
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
  private minDistance = 5;

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

  measure(targetRect: IRect, others: IRect[]) {
    return {
      x: this.measureX(targetRect, others),
      y: this.measureY(targetRect, others)
    };
  }

  private measureX(targetRect: IRect, others: IRect[]) {
    let minDistance = this.minDistance;
    let resultRect: IRect | null = null;
    let line: ILineSegment | null = null;
    let offset = 0;
    const targetLeft = targetRect.x,
      targetCenter = targetRect.x + targetRect.width / 2,
      targetRight = targetRect.x + targetRect.width;
    const targetList = [targetLeft, targetCenter, targetRight];
    for (let i = 0; i < others.length; i++) {
      const other = others[i];
      // 相交的矩形不做比较
      if (isRectIntersect(other, targetRect)) continue;
      const otherLeft = other.x,
        otherCenter = other.x + other.width / 2,
        otherRight = other.x + other.width;
      const otherList = [otherLeft, otherCenter, otherRight];
      targetList.forEach((targetX, i) => {
        otherList.forEach((otherX, j) => {
          let distance = Math.abs(targetX - otherX);
          if (distance < minDistance) {
            minDistance = distance;
            resultRect = other;
            if (targetRect.y < other.y) {
              line = [
                { x: otherX, y: targetRect.y + targetRect.height },
                { x: otherX, y: other.y }
              ];
            } else {
              line = [
                { x: otherX, y: targetRect.y },
                { x: otherX, y: other.y + other.height }
              ];
            }
            offset = otherX - targetX;
          }
        });
      });
    }
    return { line, offset };
  }

  private measureY(targetRect: IRect, others: IRect[]) {
    let minDistance = this.minDistance;
    let resultRect: IRect | null = null;
    let line: ILineSegment | null = null;
    let offset = 0;
    const targetTop = targetRect.y,
      targetCenter = targetRect.y + targetRect.height / 2,
      targetBottom = targetRect.y + targetRect.height;
    const targetList = [targetTop, targetCenter, targetBottom];
    for (let i = 0; i < others.length; i++) {
      const other = others[i];
      // 相交的矩形不做比较
      if (isRectIntersect(other, targetRect)) continue;
      const otherTop = other.y,
        otherCenter = other.y + other.height / 2,
        otherBottom = other.y + other.height;
      const otherList = [otherTop, otherCenter, otherBottom];
      targetList.forEach((targetY, i) => {
        otherList.forEach((otherY, j) => {
          let distance = Math.abs(targetY - otherY);
          if (distance < minDistance) {
            minDistance = distance;
            resultRect = other;
            if (targetRect.x < other.x) {
              line = [
                { x: targetRect.x + targetRect.width, y: otherY },
                { x: other.x, y: otherY }
              ];
            } else {
              line = [
                { x: targetRect.x, y: otherY },
                { x: other.x + other.width, y: otherY }
              ];
            }
            offset = otherY - targetY;
          }
        });
      });
    }
    return { line, offset };
  }

  paintRoot(ctx: CanvasRenderingContext2D): void {}

  paintTop(ctx: CanvasRenderingContext2D): void {}

  dispose() {
    this.clear();
  }
}
