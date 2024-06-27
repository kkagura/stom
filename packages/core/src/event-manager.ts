import { IRect, getRectByTwoPoint, isRectIntersect } from '@stom/geo';
import { Action } from './action-manager';
import { Editor, EditorPlugin } from './editor';
import { Model, ModelEvents } from './models';
import { Control, ControlEvents } from './models/control';

export class EventManager implements EditorPlugin {
  private mousedown = false;
  /**
   * 框选框
   */
  private selectionRect: IRect | null = null;

  /**
   * 当前鼠标下的元素
   */
  private mouseEl: Model | null = null;

  /**
   * 当前鼠标下元素的控制点
   */
  private mouseControl: Control | null = null;

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
    const el = this.mouseEl;
    // 反选
    if (e.shiftKey && el) {
      selectionManager.toggleSelection(el);
      return;
    }
    if (this.mouseControl) {
      // 如果当前点击的是控制点，由控制点自行处理交互
      this.mouseControl.handleMousedown(e, this.editor);
    } else if (el) {
      // 如果当前点击的是元素，执行拖拽元素的逻辑
      this.handleMoveElement(e, el);
    } else {
      // 鼠标下是空白时，执行框选逻辑
      this.handleBoxSelection(e);
    }
  };

  /**
   * 选中元素并拖拽移动
   * @param e
   */
  handleMoveElement(e: MouseEvent, el: Model) {
    const selectionManager = this.editor.selectionManager;
    const zoom = this.editor.viewportManager.getZoom();
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
      this.selectionRect = null;
      selection.forEach(m => {
        m.move(offsetX / zoom, offsetY / zoom);
      });
    };
    const onUp = (ev: MouseEvent) => {
      const offsetX = ev.clientX - startX;
      const offsetY = ev.clientY - startY;
      if (offsetX || offsetY) {
        let action: Action = {
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
      }

      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('mouseleave', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('mouseleave', onUp);
  }

  /**
   * 通过选择框多选
   * @param e
   */
  handleBoxSelection(e: MouseEvent) {
    const selectionManager = this.editor.selectionManager;
    const startPoint = this.editor.viewportManager.getCursorScenePoint(e);
    let startX = e.clientX,
      startY = e.clientY;

    const onMove = (ev: MouseEvent) => {
      const currentPoint = this.editor.viewportManager.getCursorScenePoint(ev);
      this.selectionRect = getRectByTwoPoint(startPoint, currentPoint);
    };
    const onUp = (ev: MouseEvent) => {
      const offsetX = ev.clientX - startX;
      const offsetY = ev.clientY - startY;
      if (offsetX || offsetY) {
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
      } else {
        selectionManager.clearSelection();
      }

      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('mouseleave', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('mouseleave', onUp);
  }

  handleMouseMove = (e: MouseEvent) => {
    if (this.mousedown) return;
    const point = this.editor.viewportManager.getCursorScenePoint(e);
    const resizeControl = this.editor.selectionManager.getControlAt(point);
    const oldModel = this.mouseEl;
    const oldControl = this.mouseControl;
    if (resizeControl) {
      this.mouseControl = resizeControl;
      this.mouseEl = null;
    } else {
      const result = this.editor.getElementAt(e) || null;
      this.mouseEl = result?.model || null;
      this.mouseControl = result?.control || null;
    }
    if (this.mouseControl) {
      this.setCursorStyle(this.mouseControl.getCursor());
    } else if (this.mouseEl) {
      this.setCursorStyle('move');
    } else {
      this.setCursorStyle('default');
    }

    if (this.mouseEl !== oldModel) {
      if (oldModel) {
        oldModel.emit(ModelEvents.mouseOut, e);
      }
      if (this.mouseEl) {
        this.mouseEl.emit(ModelEvents.mouseIn, e);
      }
    }

    if (this.mouseControl !== oldControl) {
      if (oldControl) {
        oldControl.emit(ControlEvents.mouseOut, e);
      }
      if (this.mouseControl) {
        this.mouseControl.emit(ControlEvents.mouseIn, e);
      }
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

  isHovered(model: Model) {
    return this.mouseEl === model;
  }

  static SELECTION_STROKE_COLOR = '#0f8eff';
  static SELECTION_FILL_COLOR = '#0f8eff33';
}
