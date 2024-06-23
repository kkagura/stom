import { IRect, getRectByTwoPoint, isRectIntersect } from '@stom/geo';
import { Action } from './action-manager';
import { Editor, EditorPlugin } from './editor';
import { Model } from './models';

export class EventManager implements EditorPlugin {
  private mousedown = false;
  /**
   * 框选框
   */
  private selectionRect: IRect | null = null;

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
    this.selectionRect = null;
    const selectionManager = this.editor.selectionManager;
    const zoom = this.editor.viewportManager.getZoom();
    const el = this.editor.getElementAt(e);
    if (e.shiftKey && el) {
      selectionManager.toggleSelection(el);
      return;
    }
    const startPoint = this.editor.viewportManager.getScenePoint(
      {
        x: e.clientX,
        y: e.clientY
      },
      zoom
    );
    if (el && !selectionManager.isSelected(el)) {
      selectionManager.setSelection([el]);
    }
    let startX = e.clientX,
      startY = e.clientY,
      lastX = startX,
      lastY = startY;

    const selection = selectionManager.getSelectionList();
    const onMove = (ev: MouseEvent) => {
      const offsetX = ev.clientX - lastX;
      const offsetY = ev.clientY - lastY;
      lastX = ev.clientX;
      lastY = ev.clientY;
      if (el) {
        this.selectionRect = null;
        // el.move(offsetX / zoom, offsetY / zoom);
        selection.forEach(m => {
          m.move(offsetX / zoom, offsetY / zoom);
        });
      } else {
        const currentPoint = this.editor.viewportManager.getScenePoint({
          x: ev.clientX,
          y: ev.clientY
        });
        this.selectionRect = getRectByTwoPoint(startPoint, currentPoint);
      }
    };
    const onUp = (ev: MouseEvent) => {
      const offsetX = ev.clientX - startX;
      const offsetY = ev.clientY - startY;
      if (offsetX || offsetY) {
        let action: Action;
        if (el) {
          action = {
            undo: () => {
              selection.forEach(el => {
                el.move(-offsetX / zoom, -offsetY / zoom);
              });
            },
            redo: () => {
              selection.forEach(el => {
                el.move(offsetX / zoom, offsetY / zoom);
              });
            }
          };
          this.editor.actionManager.push(action);
        } else {
          const rect = this.selectionRect!;
          this.selectionRect = null;
          const selection: Model[] = [];
          this.editor.box.each(m => {
            const renderRect = m.getRenderRect();
            if (isRectIntersect(rect, renderRect)) {
              selection.push(m);
            }
          });
          selectionManager.setSelection(selection);
        }
      } else if (!el) {
        selectionManager.clearSelection();
      }

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
    if (e.ctrlKey || e.metaKey) {
      const point = { x: e.offsetX, y: e.offsetY };
      if (e.deltaY > 0) {
        this.editor.viewportManager.zoomIn(point);
      } else {
        this.editor.viewportManager.zoomOut(point);
      }
    } else {
      const zoom = this.editor.viewportManager.getZoom();
      this.editor.viewportManager.move(-e.deltaX / zoom, -e.deltaY / zoom);
    }
  };

  setCursorStyle(cursor: string) {
    this.editor.topCanvas.style.cursor = cursor;
  }

  dispose() {
    this.editor.topCanvas.removeEventListener('mousedown', this.handleMouseDown);
    this.editor.topCanvas.removeEventListener('mousemove', this.handleMouseMove);
    this.editor.topCanvas.removeEventListener('mouseup', this.handleMouseUp);
    this.editor.topCanvas.removeEventListener('mouseleave', this.handleMouseUp);
    this.editor.topCanvas.removeEventListener('wheel', this.handleMouseWheel);
  }

  paint(ctx: CanvasRenderingContext2D): void {
    if (this.selectionRect) {
      ctx.beginPath();
      ctx.roundRect(this.selectionRect.x, this.selectionRect.y, this.selectionRect.width, this.selectionRect.height, 2);
      ctx.fillStyle = EventManager.SELECTION_FILL_COLOR;
      ctx.fill();
      ctx.strokeStyle = EventManager.SELECTION_STROKE_COLOR;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  /**
   * 框选
   */
  static SELECTION_STROKE_COLOR = '#0f8eff';
  static SELECTION_FILL_COLOR = '#0f8eff33';
}
