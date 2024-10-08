import { ILineSegment, IPoint, IRect, Matrix, getRectByPoints, isRectIntersect } from '@stom/geo';
import { Action } from './action-manager';
import { Editor } from './editor';
import { LinkModel, Model, ModelEvents } from './models';
import { Control } from './models/control';
import { CommonEvents } from './models/common-events';
import { EditorPlugin } from './plugin';
import { EventEmitter, isEqual } from '@stom/shared';

export enum EventManagerEvents {
  MOVE_ELEMENTS_START = 'moveElementsStart',
  MOVING_ELEMENTS = 'movingElements',
  MOVE_ELEMENTS_END = 'moveElementsEnd'
}

interface Events {
  [CommonEvents.REPAINT](): void;
  [EventManagerEvents.MOVE_ELEMENTS_END](): void;
  [EventManagerEvents.MOVING_ELEMENTS](): void;
  [EventManagerEvents.MOVE_ELEMENTS_START](): void;
}

export class EventManager extends EventEmitter<Events> implements EditorPlugin<Events> {
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

  /**
   * 移动元素的缓存
   */
  private positionCache: Map<string, IPoint> | null = null;

  /**
   * 水平方向的辅助线
   */
  private alignLineX: ILineSegment | null = null;

  /**
   * 垂直方向的辅助线
   */
  private alignLineY: ILineSegment | null = null;

  constructor(private editor: Editor) {
    super();
    this.setup();
  }

  setup() {
    this.editor.topCanvas.addEventListener('mousedown', this.handleMouseDown);
    this.editor.topCanvas.addEventListener('mousemove', this.handleMouseMove);
    this.editor.topCanvas.addEventListener('mouseup', this.handleMouseUp);
    this.editor.topCanvas.addEventListener('mouseleave', this.handleMouseUp);
    this.editor.topCanvas.addEventListener('wheel', this.handleMouseWheel);
    this.editor.topCanvas.addEventListener('keydown', this.handleKeydonw);
    this.editor.topCanvas.addEventListener('keyup', this.handleKeyup);
    this.editor.topCanvas.addEventListener('dblclick', this.handleDblclick);
  }

  handleMouseDown = (e: MouseEvent) => {
    this.mousedown = true;
    this.selectionRect = null;
    const selectionManager = this.editor.selectionManager;
    const el = this.mouseEl;
    // 反选
    if ((e.ctrlKey || e.metaKey) && el) {
      selectionManager.toggleSelection(el);
      return;
    }
    if (this.mouseControl) {
      // 如果当前点击的是控制点，由控制点自行处理交互
      this.mouseControl.emit(CommonEvents.mouseDown, e);
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
    if (el && !selectionManager.isSelected(el)) {
      selectionManager.setSelection([el]);
    }

    const startScenePoint = this.editor.viewportManager.getCursorScenePoint(e);

    const mouseEl = this.mouseEl!;
    const selection = selectionManager.getSelectionList().filter(el => el.getMovable());
    let started = false;
    let lastScenePoint = startScenePoint;
    if (selection.length === 1 && selection[0] instanceof LinkModel) return;
    const otherRects = this.editor.box
      .getModelList()
      .filter(model => !selection.includes(model) && !(model instanceof LinkModel))
      .map(el => el.getBoundingRect());

    const onMove = (ev: MouseEvent) => {
      const currentScenePoint = this.editor.viewportManager.getCursorScenePoint(ev);
      let offsetX = currentScenePoint.x - lastScenePoint.x;
      let offsetY = currentScenePoint.y - lastScenePoint.y;
      const targetRect = { ...mouseEl.getBoundingRect() };
      if (otherRects.length && !(mouseEl instanceof LinkModel)) {
        targetRect.x += offsetX;
        targetRect.y += offsetY;
        // todo: 网格吸附
        const mResult = this.editor.alignManager.measure(targetRect, otherRects);
        offsetX += mResult.x.offset;
        currentScenePoint.x += mResult.x.offset;

        offsetY += mResult.y.offset;
        currentScenePoint.y += mResult.y.offset;

        if (!isEqual(mResult.x.line, this.alignLineX)) {
          this.alignLineX = mResult.x.line;
          this.emit(CommonEvents.REPAINT);
        }
        if (!isEqual(mResult.y.line, this.alignLineY)) {
          this.alignLineY = mResult.y.line;
          this.emit(CommonEvents.REPAINT);
        }
      }
      if (offsetX === 0 && offsetY === 0) {
        return;
      }
      if (started) {
        this.emit(EventManagerEvents.MOVING_ELEMENTS);
      } else {
        started = true;
        this.emit(EventManagerEvents.MOVE_ELEMENTS_START);
      }
      this.selectionRect = null;
      selection.forEach(m => {
        m.move(offsetX, offsetY);
      });
      lastScenePoint = currentScenePoint;
    };
    const onUp = (ev: MouseEvent) => {
      const needRepaint = !!(this.alignLineX || this.alignLineY);
      if (this.alignLineX) {
        this.alignLineX = null;
      }
      if (this.alignLineY) {
        this.alignLineY = null;
      }
      if (needRepaint) {
        this.emit(CommonEvents.REPAINT);
      }
      const offsetX = lastScenePoint.x - startScenePoint.x;
      const offsetY = lastScenePoint.y - startScenePoint.y;
      if (offsetX || offsetY) {
        let action: Action = {
          undo: () => {
            selection.forEach(el => {
              el.move(-offsetX, -offsetY);
            });
          },
          redo: () => {
            selection.forEach(el => {
              el.move(offsetX, offsetY);
            });
          }
        };
        this.editor.actionManager.push(action);
        this.emit(EventManagerEvents.MOVE_ELEMENTS_END);
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
      this.selectionRect = getRectByPoints(startPoint, currentPoint);
      this.emit(CommonEvents.REPAINT);
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
      this.emit(CommonEvents.REPAINT);

      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('mouseleave', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('mouseleave', onUp);
  }

  handleMouseMove = (e: MouseEvent) => {
    // if (this.mousedown) return;
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
    } else if (this.mouseEl && this.mouseEl.getMovable()) {
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
        oldControl.emit(CommonEvents.mouseOut, e);
      }
      if (this.mouseControl) {
        this.mouseControl.emit(CommonEvents.mouseIn, e);
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
      const point = this.editor.viewportManager.getCursorViewPoint(e);
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
    this.editor.topCanvas.removeEventListener('keydown', this.handleKeydonw);
    this.editor.topCanvas.removeEventListener('keyup', this.handleKeyup);
    this.editor.topCanvas.removeEventListener('dblclick', this.handleDblclick);
  }

  paintTop(ctx: CanvasRenderingContext2D): void {
    // 绘制框选框
    if (this.selectionRect) {
      ctx.beginPath();
      ctx.roundRect(this.selectionRect.x, this.selectionRect.y, this.selectionRect.width, this.selectionRect.height, 2);
      ctx.fillStyle = EventManager.SELECTION_FILL_COLOR;
      ctx.fill();
      ctx.strokeStyle = EventManager.SELECTION_STROKE_COLOR;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    // 绘制辅助线
    if (this.alignLineX) {
      const [p1, p2] = this.alignLineX;
      ctx.beginPath();
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 10]);
      ctx.strokeStyle = 'red';
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }
    if (this.alignLineY) {
      const [p1, p2] = this.alignLineY;
      ctx.beginPath();
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 10]);
      ctx.strokeStyle = 'red';
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }
  }

  paintRoot(ctx: CanvasRenderingContext2D): void {}

  isHovered(model: Model) {
    return this.mouseEl === model;
  }

  handleKeydonw = (e: KeyboardEvent) => {
    const key = e.key.toLowerCase();
    const ctrlOrMeta = e.ctrlKey || e.metaKey;
    if (key === 'backspace' || e.key === 'delete') {
      this.editor.removeSelection();
    } else if (key === 'z' && ctrlOrMeta) {
      if (e.shiftKey) {
        this.editor.actionManager.redo();
      } else {
        this.editor.actionManager.undo();
      }
    } else if (key === 'y' && ctrlOrMeta) {
      this.editor.actionManager.redo();
    } else if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
      this.moveElementByKey(key);
    } else if (key === 'a' && ctrlOrMeta) {
      e.preventDefault();
      this.editor.selectionManager.selectAll();
    }
  };

  moveElementByKey(dir: string) {
    const gap = 5;
    const moveMap: Record<string, [number, number]> = {
      arrowup: [0, -gap],
      arrowdown: [0, gap],
      arrowleft: [-gap, 0],
      arrowright: [gap, 0]
    };
    const paires = moveMap[dir];
    if (!paires) return;
    const [dx, dy] = paires;
    const selection = this.editor.selectionManager.getSelectionList().filter(el => el.getMovable());
    if (!this.positionCache) {
      this.positionCache = new Map();
      selection.forEach(el => {
        this.positionCache!.set(el.id, { ...el.getPosition() });
      });
    }

    selection.forEach(m => {
      m.move(dx, dy);
    });
  }

  handleKeyup = (e: KeyboardEvent) => {
    if (this.positionCache) {
      const selection = this.editor.selectionManager.getSelectionList().filter(el => el.getMovable());
      const positionCache = this.positionCache;
      this.positionCache = null;
      const newPostionCache = new Map<string, IPoint>();
      selection.forEach(el => {
        newPostionCache.set(el.id, { ...el.getPosition() });
      });
      const action = {
        undo() {
          selection.forEach(el => {
            const oldPos = positionCache.get(el.id)!;
            const newPos = newPostionCache.get(el.id)!;
            const dx = oldPos.x - newPos.x;
            const dy = oldPos.y - newPos.y;
            el.move(dx, dy);
          });
        },
        redo() {
          selection.forEach(el => {
            const oldPos = positionCache.get(el.id)!;
            const newPos = newPostionCache.get(el.id)!;
            const dx = newPos.x - oldPos.x;
            const dy = newPos.y - oldPos.y;
            el.move(dx, dy);
          });
        }
      };
      this.editor.actionManager.push(action);
    }
  };

  handleDblclick = (e: MouseEvent) => {
    if (this.mouseEl) {
      // todo: 显示输入框后如果视图窗口改变了，输入框大小也应该跟着改变
      const el = this.mouseEl;
      const zoom = this.editor.viewportManager.getZoom();
      const pos = this.editor.viewportManager.getViewPoint({ x: 0, y: 0 }, zoom);
      const rect = el.getRect();
      const tf = new Matrix(...this.mouseEl.getWorldTransform()).scale(zoom, zoom);
      const text = el.getText();
      const textStyle = el.getTextStyle();
      el.setTextVisible(false);
      this.editor.textInput.show(rect, pos, tf.getArray(), text, textStyle, (text: string) => {
        const oldText = el.getText();
        el.setText(text);
        el.setTextVisible(true);
        const action = {
          undo() {
            el.setText(oldText);
          },
          redo() {
            el.setText(text);
          }
        };
        this.editor.actionManager.push(action);
      });
    }
  };

  static SELECTION_STROKE_COLOR = '#0f8eff';
  static SELECTION_FILL_COLOR = '#0f8eff33';
}
