import { useDragEvent } from '@stom/shared';
import { Model } from '.';
import { Editor } from '../editor';
import { Control } from './control';
import { LinkModel } from './link-model';

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
    useDragEvent({
      onDragMove: e => {
        const endPoint = editor.viewportManager.getCursorScenePoint(e);
        if (!linkModel) {
          linkModel = new LinkModel(this, endPoint);
          linkModel.setLayerId(layerId);
          editor.box.addModel(linkModel);
        } else {
          linkModel.setEnd(endPoint);
        }
      },
      onDragEnd(e) {
        if (!linkModel) return;
        const res = editor.getElementAt(e);
        if (res && res.control && res.control instanceof LinkControl) {
          linkModel.setEnd(res.control);
        }
      }
    });
  }

  paint(ctx: CanvasRenderingContext2D): void {
    const rect = this.getRect();
    const centerX = rect.x + rect.width / 2;
    const centerY = rect.y + rect.height / 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, LinkControl.SIZE / 2, 0, Math.PI * 2);
    if (this.getIsHovered()) {
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
