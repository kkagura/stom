import { IRect, isRectIntersect, mergeRects } from '@stom/geo';
import { Box, BoxEvents } from './box';
import { getDevicePixelRatio, setCanvasSize } from '@stom/shared';
import { EventManager } from './event-manager';
import { ViewportEvents, ViewportManager } from './viewport-manager';
import { Model } from './models';
import { ActionManager } from './action-manager';
import { SelectionManager } from './selection-manager';

export interface EditorPlugin {
  paint(ctx: CanvasRenderingContext2D): void;
}

export class Editor {
  rootCanvas: HTMLCanvasElement;
  private rootCtx: CanvasRenderingContext2D;

  mainCanvas: HTMLCanvasElement;
  private mainCtx: CanvasRenderingContext2D;

  topCanvas: HTMLCanvasElement;
  private topCtx: CanvasRenderingContext2D;

  eventManager: EventManager;
  viewportManager: ViewportManager;
  actionManager: ActionManager;
  selectionManager: SelectionManager;

  private dirtyList: Set<Model> = new Set();
  private paintAll: boolean = true;

  private frameRects: Map<string, IRect> = new Map();

  private plugins: EditorPlugin[] = [];

  constructor(
    public container: HTMLElement,
    public box: Box
  ) {
    [this.rootCanvas, this.rootCtx] = this.createCanvas();
    [this.mainCanvas, this.mainCtx] = this.createCanvas();
    [this.topCanvas, this.topCtx] = this.createCanvas();
    this.resize();

    this.actionManager = new ActionManager();

    this.eventManager = new EventManager(this);
    this.installPlugin(this.eventManager);

    this.selectionManager = new SelectionManager(this);
    this.installPlugin(this.selectionManager);

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

    requestAnimationFrame(this.repaint);
  }

  createCanvas(): [HTMLCanvasElement, CanvasRenderingContext2D] {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    Object.assign(canvas.style, {
      position: 'absolute',
      left: '0px',
      top: '0px',
      width: '100%',
      height: '100%'
    });
    this.container.appendChild(canvas);
    return [canvas, ctx];
  }

  resize() {
    const { width, height } = this.container.getBoundingClientRect();
    setCanvasSize(this.rootCanvas, width, height);
    setCanvasSize(this.mainCanvas, width, height);
    setCanvasSize(this.topCanvas, width, height);
  }

  installPlugin(plugin: EditorPlugin) {
    this.plugins.push(plugin);
  }

  repaint = () => {
    if (this.paintAll) {
      this.fullRepaint();
    } else if (this.dirtyList.size) {
      this.partRepaint();
    }
    this.paintAll = false;
    this.dirtyList.clear();
    this.paintPlugin();
    requestAnimationFrame(this.repaint);
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
    const ctx = this.mainCtx;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const viewport = this.viewportManager.getViewport();
    ctx.clearRect(0, 0, this.mainCanvas.width, this.mainCanvas.height);

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

    const ctx = this.mainCtx;
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
      model.beforePaint(ctx, this);
      model.paint(ctx);
      model.afterPaint(ctx, this);
    } else {
      this.frameRects.delete(model.id);
    }
  }

  paintPlugin() {
    const ctx = this.topCtx;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const viewport = this.viewportManager.getViewport();
    ctx.clearRect(0, 0, this.mainCanvas.width, this.mainCanvas.height);

    const dpr = getDevicePixelRatio();
    const zoom = this.viewportManager.getZoom();
    const dx = -viewport.x;
    const dy = -viewport.y;
    ctx.scale(dpr * zoom, dpr * zoom);
    ctx.translate(dx, dy);
    this.plugins.forEach(p => p.paint(ctx));
    ctx.restore();
  }
}
