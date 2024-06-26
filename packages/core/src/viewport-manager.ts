import { EventEmitter } from '@stom/shared';
import { Editor } from './editor';
import { IPoint, IRect } from '@stom/geo';

export enum ViewportEvents {
  change = 'change'
}

interface Events {
  [ViewportEvents.change]: () => void;
}

export class ViewportManager extends EventEmitter<Events> {
  private x: number = 0;
  private y: number = 0;
  private zoom: number = 1;

  constructor(private editor: Editor) {
    super();
  }

  getZoom() {
    return this.zoom;
  }

  zoomOut(point: IPoint) {
    const zoom = this.zoom;
    let newZoom = zoom * (1 + ViewportManager.ZOOM_STEP);
    newZoom = Math.min(newZoom, ViewportManager.MAX_ZOOM);
    if (newZoom !== zoom) {
      const { x: viewX, y: viewY } = point;
      const { x: sceneX, y: sceneY } = this.getScenePoint(point);
      const newX = sceneX - viewX / newZoom;
      const newY = sceneY - viewY / newZoom;
      this.x = newX;
      this.y = newY;
      this.zoom = newZoom;
      this.emit(ViewportEvents.change);
    }
  }

  zoomIn(point: IPoint) {
    const zoom = this.zoom;
    let newZoom = zoom * (1 - ViewportManager.ZOOM_STEP);
    newZoom = Math.max(newZoom, ViewportManager.MIN_ZOOM);
    if (newZoom !== zoom) {
      const { x: viewX, y: viewY } = point;
      const { x: sceneX, y: sceneY } = this.getScenePoint(point);
      const newX = sceneX - viewX / newZoom;
      const newY = sceneY - viewY / newZoom;
      this.x = newX;
      this.y = newY;
      this.zoom = newZoom;
      this.emit(ViewportEvents.change);
    }
  }

  move(x: number, y: number) {
    this.x -= x;
    this.y -= y;

    if (x !== 0 || y !== 0) {
      this.emit(ViewportEvents.change);
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

  getCursorViewPoint(e: MouseEvent) {
    return { x: e.offsetX, y: e.offsetY };
  }

  getCursorScenePoint(e: MouseEvent) {
    const viewPoint = this.getCursorViewPoint(e);
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
    const { x: scrollX, y: scrollY } = this;
    return {
      x: (x - scrollX) / zoom,
      y: (y - scrollY) / zoom
    };
  }

  getViewCenter() {
    const viewport = this.getViewport();
    return {
      x: viewport.width / 2,
      y: viewport.height / 2
    };
  }

  static ZOOM_STEP = 0.1;
  static MIN_ZOOM = 0.1;
  static MAX_ZOOM = 5;
}
