import { IRect, isRectIntersect, mergeRects } from '@stom/geo';
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

  private dirtyList: Set<Model> = new Set();
  private paintAll: boolean = true;

  private frameRects: Map<string, IRect> = new Map();

  constructor(
    public container: HTMLElement,
    public box: Box
  ) {
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
    this.viewportManager.on(ViewportEvents.change, () => {
      this.paintAll = true;
    });

    this.box.on(BoxEvents.modelsChange, models => {
      models.forEach(m => this.dirtyList.add(m));
    });
    this.box.on(BoxEvents.removeModels, models => {
      models.forEach(m => this.frameRects.delete(m.id));
    });

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
    if (this.paintAll) {
      this.fullRepaint();
    } else if (this.dirtyList.size) {
      this.partRepaint();
    }
    this.paintAll = false;
    this.dirtyList.clear();
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

  getElementAt(e: MouseEvent): Model | null {
    const { x, y } = this.viewportManager.getScenePoint({ x: e.clientX, y: e.clientY });
    let res: Model | null = null;
    this.box.reverseEach(m => {
      if (m.hitTest(x, y)) {
        res = m;
        return true;
      }
    });
    return res;
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
      this.paintModel(m, ctx);
    });
    ctx.restore();
  }

  findDirtyRect(): {
    rect: IRect;
    models: Set<Model>;
  } {
    if (this.dirtyList.size === 0)
      return {
        rect: { x: 0, y: 0, width: 0, height: 0 },
        models: new Set()
      };
    const viewRect = this.viewportManager.getViewRect();
    const modelSet = new Set<Model>(this.dirtyList);
    const modelList = this.box.getModelList();
    const renderRects = [...modelSet].reduce((acc, model) => {
      acc.push(model.getRenderRect());
      const lastRenderRect = this.frameRects.get(model.id);
      if (lastRenderRect) {
        acc.push(lastRenderRect);
      }
      return acc;
    }, [] as IRect[]);
    const dirtyRect = mergeRects(...renderRects);
    for (let i = 0; i < modelList.length; i++) {
      const m = modelList[i];
      if (modelSet.has(m)) continue;
      const renderRect = m.getRenderRect();
      if (!isRectIntersect(renderRect, viewRect)) continue;
      if (isRectIntersect(renderRect, dirtyRect)) {
        modelSet.add(m);
        i = 0;
      }
    }
    return {
      rect: dirtyRect,
      models: modelSet
    };
  }

  partRepaint() {
    const { rect, models } = this.findDirtyRect();
    if (!models.size) return;

    const ctx = this.topCtx;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const viewport = this.viewportManager.getViewport();

    const dpr = getDevicePixelRatio();
    const zoom = this.viewportManager.getZoom();
    const dx = -viewport.x;
    const dy = -viewport.y;
    ctx.scale(dpr * zoom, dpr * zoom);
    ctx.translate(dx, dy);

    ctx.clearRect(rect.x, rect.y, rect.width, rect.height);

    this.box.each(m => {
      if (models.has(m)) {
        this.paintModel(m, ctx);
      }
    });

    // debug start
    // ctx.beginPath();
    // ctx.rect(rect.x + 2, rect.y + 2, rect.width - 4, rect.height - 4);
    // ctx.strokeStyle = 'green';
    // ctx.stroke();
    // debug end

    ctx.restore();
  }

  paintModel(model: Model, ctx: CanvasRenderingContext2D) {
    if (this.box.has(model)) {
      const renderRect = model.getRenderRect();
      this.frameRects.set(model.id, { ...renderRect });
      model.render(ctx);
    } else {
      this.frameRects.delete(model.id);
    }
  }
}
