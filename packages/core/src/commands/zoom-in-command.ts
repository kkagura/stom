import { Editor } from '../editor';
import { ViewportEvents, ViewportManager } from '../viewport-manager';
import { Command } from './command';

export class ZoomInCommand extends Command {
  static name = 'zoomIn';

  constructor(editor: Editor) {
    super(editor);
    editor.viewportManager.on(ViewportEvents.ZOOM_CHANGE, this.statusChange);
  }

  execute(): void {
    const viewRect = this.editor.viewportManager.getViewRect();
    const centerP = {
      x: viewRect.x + viewRect.width / 2,
      y: viewRect.y + viewRect.height / 2
    };
    this.editor.viewportManager.zoomIn(centerP);
  }

  isEnable(): boolean {
    return this.editor.viewportManager.getZoom() > ViewportManager.MIN_ZOOM;
  }

  dispose(): void {
    super.dispose();
    this.editor.viewportManager.off(ViewportEvents.ZOOM_CHANGE, this.statusChange);
  }

  getName() {
    return ZoomInCommand.name;
  }
}
