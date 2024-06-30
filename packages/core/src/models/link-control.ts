import { useDragEvent } from '@stom/shared';
import { Model } from '.';
import { Editor } from '../editor';
import { Control } from './control';
import { LinkModel } from './link-model';
import { IPoint, getDiretion } from '@stom/geo';

export class LinkControl extends Control<Model> {
  constructor(host: Model, tag: string) {
    super(host, tag);
  }

  init() {
    this.setSize(LinkControl.SIZE, LinkControl.SIZE);
  }

  handleMousedown(e: MouseEvent, editor: Editor): void {
    let linkModel: LinkModel | null = null;
    const host = this.getHost();
    const layerId = host.getLayerId();
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

          if (!linkModel) {
            linkModel = new LinkModel(this, end);
            linkModel.setLayerId(layerId);
            editor.box.addModel(linkModel);
          } else {
            linkModel.setEndDirection(getDiretion(movement));
            linkModel.setEnd(end);
          }
        },
        onDragEnd: e => {
          // todo: ActionManager
          this.setIsActive(false);
          if (!linkModel) return;
          const res = editor.getElementAt(e);
          if (res && res.control && res.control instanceof LinkControl) {
            linkModel.setEnd(res.control);
          }
        }
      },
      e
    );
  }

  paint(ctx: CanvasRenderingContext2D): void {
    const rect = this.getRect();
    const centerX = rect.x + rect.width / 2;
    const centerY = rect.y + rect.height / 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, LinkControl.SIZE / 2, 0, Math.PI * 2);
    if (this.getIsHovered() || this.getIsActive()) {
      ctx.fillStyle = LinkControl.FILL_COLOR;
      ctx.fill();
    }
    ctx.strokeStyle = LinkControl.BORDER_COLOR;
    ctx.lineWidth = LinkControl.BORDER_WIDTH;
    ctx.stroke();
  }

  getCursor(): string {
    return 'crosshair';
  }

  static SIZE = 8;
  static BORDER_WIDTH = 2;
  static BORDER_COLOR = '#0f8eff';
  static FILL_COLOR = '#0f8eff';
}
