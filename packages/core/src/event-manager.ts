import { Action } from './action-manager';
import { Editor } from './editor';

export class EventManager {
  private mousedown = false;

  constructor(private editor: Editor) {
    this.setup();
  }

  setup() {
    this.editor.topCanvas.addEventListener('mousedown', this.handleMouseDown);
    this.editor.topCanvas.addEventListener('mousemove', this.handleMouseMove);
    this.editor.topCanvas.addEventListener('mouseup', this.handleMouseUp);
    this.editor.topCanvas.addEventListener('mouseleave', this.handleMouseUp);
    this.editor.topCanvas.addEventListener('wheel', this.handleMouseWheel);
  }

  handleMouseDown = (e: MouseEvent) => {
    this.mousedown = true;
    const zoom = this.editor.viewportManager.getZoom();
    const els = this.editor.getElementsAt(e);
    const isOnFloor = els.length === 0;
    let startX = e.clientX,
      startY = e.clientY,
      lastX = startX,
      lastY = startY;
    const onMove = (ev: MouseEvent) => {
      const offsetX = ev.clientX - lastX;
      const offsetY = ev.clientY - lastY;
      lastX = ev.clientX;
      lastY = ev.clientY;
      if (isOnFloor) {
        this.editor.viewportManager.move(offsetX / zoom, offsetY / zoom);
      } else {
        els.forEach(el => {
          el.move(offsetX / zoom, offsetY / zoom);
        });
      }
    };
    const onUp = (ev: MouseEvent) => {
      const offsetX = ev.clientX - startX;
      const offsetY = ev.clientY - startY;
      let action: Action;
      if (isOnFloor) {
        action = {
          undo: () => {
            this.editor.viewportManager.move(-offsetX / zoom, -offsetY / zoom);
          },
          redo: () => {
            this.editor.viewportManager.move(offsetX / zoom, offsetY / zoom);
          }
        };
      } else {
        action = {
          undo: () => {
            els.forEach(m => {
              m.move(-offsetX / zoom, -offsetY / zoom);
            });
          },
          redo: () => {
            els.forEach(m => {
              m.move(offsetX / zoom, offsetY / zoom);
            });
          }
        };
      }
      this.editor.actionManager.push(action);

      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('mouseleave', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('mouseleave', onUp);
  };

  handleMouseMove = (e: MouseEvent) => {
    if (this.mousedown) return;
    const els = this.editor.getElementsAt(e);
    const m = els[0];
    if (m) {
      this.setCursorStyle('move');
    } else {
      this.setCursorStyle('default');
    }
  };

  handleMouseUp = (e: MouseEvent) => {
    this.mousedown = false;
  };

  handleMouseLeave = (e: MouseEvent) => {
    this.mousedown = false;
  };

  handleMouseWheel = (e: WheelEvent) => {
    e.preventDefault();
    const point = { x: e.offsetX, y: e.offsetY };
    if (e.deltaY > 0) {
      this.editor.viewportManager.zoomIn(point);
    } else {
      this.editor.viewportManager.zoomOut(point);
    }
  };

  setCursorStyle(cursor: string) {
    this.editor.topCanvas.style.cursor = cursor;
  }
}
