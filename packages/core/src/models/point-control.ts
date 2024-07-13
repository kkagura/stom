import { useDragEvent } from '@stom/shared';
import { Model } from './model';
import { Editor } from '../editor';
import { Control } from './control';
import { LinkModel } from './link-model';
import { IPoint } from '@stom/geo';
import { CommonEvents } from './common-events';
import { LinkControl } from './link-control';

export class PointControl extends Control<LinkModel> {
  constructor(host: LinkModel, tag: string) {
    super(host, tag);
    host.on(CommonEvents.rectChange, this.updatePosition);
  }

  updatePosition = () => {
    this.getHost().updateControlPosition();
  };

  init() {
    this.setSize(PointControl.SIZE, PointControl.SIZE);
  }

  handleMousedown(e: MouseEvent, editor: Editor): void {
    const host = this.getHost();
    const oldEnd = host.getEnd();
    useDragEvent(
      {
        onDragStart: e => {
          this.setIsActive(true);
        },
        onDragMove: (e, movement) => {
          const res = editor.getElementAt(e);
          let end: IPoint | LinkControl;
          if (res && res.control && res.control instanceof LinkControl && res.control !== this) {
            end = res.control;
          } else {
            end = editor.viewportManager.getCursorScenePoint(e);
          }
          this.getHost().setEnd(end);
        },
        onDragEnd: e => {
          this.setIsActive(false);
          const newEnd = this.getHost().getEnd();
          if (newEnd !== oldEnd) {
            const action = {
              undo: () => {
                host.setEnd(oldEnd);
              },
              redo: () => {
                host.setEnd(newEnd);
              }
            };
            editor.actionManager.push(action);
          }
        }
      },
      e
    );
  }

  paint(ctx: CanvasRenderingContext2D): void {
    const rect = this.getRect();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.width, rect.height);
    ctx.fillStyle = ctx.fillStyle = this.getIsHovered() || this.getIsActive() ? PointControl.BORDER_COLOR : '#fff';
    ctx.fill();
    ctx.setLineDash([]);
    ctx.strokeStyle = PointControl.BORDER_COLOR;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  getCursor(): string {
    return 'move';
  }

  static SIZE = 8;
  static BORDER_WIDTH = 2;
  static BORDER_COLOR = '#0f8eff';
  static FILL_COLOR = '#0f8eff';
}
