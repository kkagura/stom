import { IRect } from '@stom/geo';
import { Box, BoxEvents } from './box';
import { getDevicePixelRatio } from '@stom/shared';
import { EventManager } from './event-manager';
import { ViewportEvents, ViewportManager } from './viewport-manager';
import { Model } from './models';
import { ActionManager } from './action-manager';

export class Editor {
  rootCanvas: HTMLCanvasElement;
  topCanvas: HTMLCanvasElement;
  private rootCtx: CanvasRenderingContext2D;
  private topCtx: CanvasRenderingContext2D;
  eventManager: EventManager;
  viewportManager: ViewportManager;
  actionManager: ActionManager;

  private dirty: boolean = true;
  setDirty = () => {
    this.dirty = true;
  };

  constructor(
    public container: HTMLElement,
    public box: Box
  ) {
    const setDirty = this.setDirty;
    this.rootCanvas = document.createElement('canvas');
    this.rootCtx = this.rootCanvas.getContext('2d')!;
    Object.assign(this.rootCanvas.style, {
      position: 'absolute',
      left: '0px',
      top: '0px',
      width: '100%',
      height: '100%'
    });

    this.topCanvas = document.createElement('canvas');
    this.topCtx = this.topCanvas.getContext('2d')!;
    Object.assign(this.topCanvas.style, {
      position: 'absolute',
      left: '0px',
      top: '0px',
      width: '100%',
      height: '100%'
    });

    this.container.appendChild(this.rootCanvas);
    this.container.appendChild(this.topCanvas);
    this.resize();

    this.actionManager = new ActionManager();

    this.eventManager = new EventManager(this);
    this.viewportManager = new ViewportManager(this);
    this.box.on(BoxEvents.change, setDirty);
    this.viewportManager.on(ViewportEvents.change, setDirty);

    requestAnimationFrame(this.render);
  }

  resize() {
    const { width, height } = this.container.getBoundingClientRect();
    const dpr = getDevicePixelRatio();
    this.rootCanvas.width = width * dpr;
    this.rootCanvas.height = height * dpr;
    Object.assign(this.rootCanvas.style, {
      width: `${width}px`,
      height: `${height}px`
    });

    this.topCanvas.width = width * dpr;
    this.topCanvas.height = height * dpr;
    Object.assign(this.topCanvas.style, {
      width: `${width}px`,
      height: `${height}px`
    });
  }

  render = () => {
    if (this.dirty) {
      this.fullRepaint();
    }
    this.dirty = false;
    requestAnimationFrame(this.render);
  };

  getElementsAt(e: MouseEvent) {
    const { x, y } = this.viewportManager.getScenePoint({ x: e.clientX, y: e.clientY });
    const results: Model[] = [];
    this.box.reverseEach(m => {
      if (m.hitTest(x, y)) {
        results.push(m);
      }
    });
    return results;
  }

  fullRepaint() {
    const ctx = this.topCtx;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const viewport = this.viewportManager.getViewport();
    ctx.clearRect(0, 0, this.topCanvas.width, this.topCanvas.height);

    const dpr = getDevicePixelRatio();
    const zoom = this.viewportManager.getZoom();
    const dx = -viewport.x;
    const dy = -viewport.y;
    ctx.scale(dpr * zoom, dpr * zoom);
    ctx.translate(dx, dy);

    this.box.each(m => {
      m.render(ctx);
    });
    ctx.restore();
  }
}
