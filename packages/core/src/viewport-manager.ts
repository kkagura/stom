import { Animation, EventEmitter, createAnimation } from '@stom/shared';
import { Editor } from './editor';
import { IPoint, IRect } from '@stom/geo';
import { CommonEvents } from './models';
import { EditorPlugin } from './plugin';

export enum ViewportEvents {
  ZOOM_CHANGE = 'zoomChange'
}

interface Events {
  [CommonEvents.change]: () => void;
  [CommonEvents.REPAINT]: () => void;
  [ViewportEvents.ZOOM_CHANGE]: (zoom: number) => void;
}

export class ViewportManager extends EventEmitter<Events> implements EditorPlugin<Events> {
  private x: number = 0;
  private y: number = 0;
  private zoom: number = 1;
  private zoomTextOpaticy = -1;
  private animation: Animation | null = null;

  constructor(private editor: Editor) {
    super();
    const { width, height } = this.getViewRect();
    this.move(width / 2, height / 2);
  }

  getZoom() {
    return this.zoom;
  }

  zoomOut(viewPt: IPoint) {
    const zoom = this.zoom;
    let newZoom = zoom * (1 + ViewportManager.ZOOM_STEP);
    newZoom = Math.min(newZoom, ViewportManager.MAX_ZOOM);
    if (newZoom !== zoom) {
      const { x: viewX, y: viewY } = viewPt;
      const { x: sceneX, y: sceneY } = this.getScenePoint(viewPt);
      const newX = sceneX - viewX / newZoom;
      const newY = sceneY - viewY / newZoom;
      this.x = newX;
      this.y = newY;
      this.zoom = newZoom;
      this.startAnimation();
      this.emit(ViewportEvents.ZOOM_CHANGE, newZoom);
      this.emit(CommonEvents.change);
    }
  }

  zoomIn(viewPt: IPoint) {
    const zoom = this.zoom;
    let newZoom = zoom * (1 - ViewportManager.ZOOM_STEP);
    newZoom = Math.max(newZoom, ViewportManager.MIN_ZOOM);
    if (newZoom !== zoom) {
      const { x: viewX, y: viewY } = viewPt;
      const { x: sceneX, y: sceneY } = this.getScenePoint(viewPt);
      const newX = sceneX - viewX / newZoom;
      const newY = sceneY - viewY / newZoom;
      this.x = newX;
      this.y = newY;
      this.zoom = newZoom;
      this.startAnimation();
      this.emit(ViewportEvents.ZOOM_CHANGE, newZoom);
      this.emit(CommonEvents.change);
    }
  }

  move(x: number, y: number) {
    this.x -= x;
    this.y -= y;

    if (x !== 0 || y !== 0) {
      this.emit(CommonEvents.change);
    }
  }

  getViewport(): IRect {
    return {
      x: this.x,
      y: this.y,
      width: parseFloat(this.editor.topCanvas.style.width),
      height: parseFloat(this.editor.topCanvas.style.height)
    };
  }

  getViewRect(): IRect {
    const viewRect = this.getViewport();
    const zoom = this.getZoom();
    return {
      x: this.x,
      y: this.y,
      width: viewRect.width / zoom,
      height: viewRect.height / zoom
    };
  }

  getCursorViewPoint(e: MouseEvent, domRect?: DOMRect) {
    // getBoundingClientRect方法性能不太好，提供一个参数让调用方可以自行获取domRect然后缓存下来
    // 避免频繁调用
    if (!domRect) {
      domRect = this.editor.container.getBoundingClientRect();
    }
    return {
      x: e.clientX - domRect.left,
      y: e.clientY - domRect.top
    };
  }

  getCursorScenePoint(e: MouseEvent, domRect?: DOMRect) {
    const viewPoint = this.getCursorViewPoint(e, domRect);
    return this.getScenePoint(viewPoint);
  }

  /**
   * 视图坐标转场景坐标
   * @param p 视图坐标
   * @param zoom
   * @returns
   */
  getScenePoint(viewPt: IPoint, zoom = this.zoom): IPoint {
    const { x, y } = viewPt;
    const { x: scrollX, y: scrollY } = this.getViewport();
    return {
      x: scrollX + x / zoom,
      y: scrollY + y / zoom
    };
  }

  /**
   * 场景坐标转视图坐标
   * @param p 场景坐标
   * @param zoom
   * @returns
   */
  getViewPoint(p: IPoint, zoom = this.zoom) {
    const { x, y } = p;
    const { x: scrollX, y: scrollY } = this.getViewport();
    return {
      x: (x - scrollX) * zoom,
      y: (y - scrollY) * zoom
    };
  }

  getViewCenter() {
    const viewport = this.getViewport();
    return {
      x: viewport.width / 2,
      y: viewport.height / 2
    };
  }

  startAnimation() {
    if (!this.animation) {
      this.animation = createAnimation({
        duration: 2000,
        startValue: 1,
        endValue: 0,
        onUpdate: t => {
          this.zoomTextOpaticy = t;
          this.emit(CommonEvents.REPAINT);
        },
        onEnd: () => {
          this.zoomTextOpaticy = -1;
        }
      });
    } else {
      this.animation.stop();
    }
    this.animation.start();
  }

  paintTop(ctx: CanvasRenderingContext2D): void {
    if (this.zoomTextOpaticy >= 0) {
      const zoom = this.getZoom();
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.font = '30px Arial';
      ctx.fillStyle = '#000';
      ctx.globalAlpha = this.zoomTextOpaticy;
      ctx.fillText(`ZOOM: ${zoom.toFixed(1)}`, 10, 40);
      ctx.restore();
    }
  }

  paintRoot(ctx: CanvasRenderingContext2D): void {}

  dispose() {
    this.clear();
    this.animation?.stop();
  }

  static ZOOM_STEP = 0.1;
  static MIN_ZOOM = 0.1;
  static MAX_ZOOM = 5;
}
