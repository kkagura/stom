import { IRect, isRectIntersect, mergeRects } from '@stom/geo';
import { Box, BoxEvents } from './box';
import { EventEmitter, clearDrawStyle, getDevicePixelRatio, setCanvasSize } from '@stom/shared';
import { EventManager } from './event-manager';
import { ViewportEvents, ViewportManager } from './viewport-manager';
import { CommonEvents, LinkModel, Model, ModelJson, ModelManager } from './models';
import { ActionManager } from './action-manager';
import { SelectionManager } from './selection-manager';
import { Control } from './models/control';
import { Grid } from './grid';
import { BasePluginEvents, EditorPlugin } from './plugin';

export interface SceneData {
  models: ModelJson[];
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
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

  grid: Grid;

  private dirtyList: Set<Model> = new Set();
  private paintAll: boolean = true;

  private frameRects: Map<string, IRect> = new Map();

  private plugins: EditorPlugin<BasePluginEvents>[] = [];
  private pluginsDirty = true;

  private showPerformance: boolean = true;

  public box = new Box();

  constructor(public container: HTMLElement) {
    container.style.position = 'relative';
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
    this.installPlugin(this.viewportManager);
    this.viewportManager.on(CommonEvents.change, () => {
      this.paintAll = true;
      this.pluginsDirty = true;
    });

    this.grid = new Grid(this);
    this.installPlugin(this.grid);

    this.box.on(BoxEvents.modelsChange, models => {
      models.forEach(m => this.dirtyList.add(m));
    });
    this.box.on(BoxEvents.removeModels, models => {
      models.forEach(m => this.frameRects.delete(m.id));
    });

    requestAnimationFrame(this.repaint);
  }

  private createCanvas(): [HTMLCanvasElement, CanvasRenderingContext2D] {
    const canvas = document.createElement('canvas');
    canvas.setAttribute('tabindex', '-1');
    const ctx = canvas.getContext('2d')!;
    Object.assign(canvas.style, {
      position: 'absolute',
      left: '0px',
      top: '0px',
      width: '100%',
      height: '100%'
    });
    this.container.appendChild(canvas);
    window.addEventListener('resize', this.resize);
    return [canvas, ctx];
  }

  resize = () => {
    const { width, height } = this.container.getBoundingClientRect();
    setCanvasSize(this.rootCanvas, width, height);
    setCanvasSize(this.mainCanvas, width, height);
    setCanvasSize(this.topCanvas, width, height);

    this.paintAll = true;
    this.pluginsDirty = true;
  };

  installPlugin(plugin: EditorPlugin<BasePluginEvents>) {
    plugin.on(CommonEvents.REPAINT, this.repaintPlugin);
    this.plugins.push(plugin);
  }

  repaintPlugin = () => {
    this.pluginsDirty = true;
  };

  repaint = () => {
    const now = Date.now();
    if (this.pluginsDirty) {
      this.paintTop();
    }

    if (this.paintAll) {
      this.fullRepaint();
    } else if (this.dirtyList.size) {
      this.partRepaint();
    }

    if (this.pluginsDirty) {
      this.paintRoot();
    }

    const time = Date.now() - now;
    if (this.showPerformance) {
      this.paintPerformance(time);
    }

    this.paintAll = false;
    this.dirtyList.clear();
    requestAnimationFrame(this.repaint);
  };

  paintPerformance(time: number) {
    let fps = 60;
    if (time > 17) {
      fps = 1000 / time;
    }
    const text = `FPS:${parseInt(fps + '')}`;
    const ctx = this.topCtx;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.font = '30px Arial';
    ctx.fillStyle = '#f00';
    const textW = ctx.measureText(text).width;
    const w = this.topCanvas.width;
    ctx.fillText(text, w - 10 - textW, 40);
    ctx.restore();
  }

  getElementsAt(e: MouseEvent) {
    const { x, y } = this.viewportManager.getCursorScenePoint(e);
    const results: Model[] = [];
    this.box.reverseEach(m => {
      if (m.hitTest(x, y)) {
        results.push(m);
      }
    });
    return results;
  }

  getElementAt(e: MouseEvent): {
    model: Model;
    control: Control | null;
  } | null {
    const { x, y } = this.viewportManager.getCursorScenePoint(e);
    let model: Model | null = null;
    let control: Control | null = null;
    this.box.reverseEach(m => {
      const hitResult = m.hitTest(x, y);
      if (hitResult) {
        model = m;
        if (typeof hitResult !== 'boolean') {
          control = hitResult;
        }
        return true;
      }
    });
    return model ? { model, control } : null;
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
    let dirtyRect = mergeRects(...renderRects);
    for (let i = 0; i < modelList.length; i++) {
      const m = modelList[i];
      if (modelSet.has(m)) continue;
      const renderRect = m.getRenderRect();
      if (!isRectIntersect(renderRect, viewRect)) continue;
      if (isRectIntersect(renderRect, dirtyRect)) {
        modelSet.add(m);
        dirtyRect = mergeRects(renderRect, dirtyRect);
        i = -1;
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
      clearDrawStyle(ctx);
      model.beforePaint(ctx, this);
      model.paint(ctx);
      model.afterPaint(ctx, this);
    } else {
      this.frameRects.delete(model.id);
    }
  }

  paintTop() {
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
    this.plugins.forEach(p => {
      clearDrawStyle(ctx);
      p.paintTop(ctx);
    });
    ctx.restore();
  }

  paintRoot() {
    const ctx = this.rootCtx;
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
    this.plugins.forEach(p => {
      clearDrawStyle(ctx);
      p.paintRoot(ctx);
    });
    ctx.restore();
  }

  addModel(model: Model) {
    this.box.addModel(model);

    const action = {
      undo: () => {
        this.box.removeModel(model);
      },
      redo: () => {
        this.box.addModel(model);
        model.reset();
      }
    };

    this.actionManager.push(action);
  }

  removeModel(model: Model) {
    const relations: Set<Model> = new Set();
    relations.add(model);

    this.box.each(m => {
      if (m instanceof LinkModel) {
        const startHost = m.getStartHost();
        const endHost = m.getEndHost();
        if (startHost === model || endHost === model) {
          relations.add(m);
        }
      }
    });
    const toBeRemoved = [...relations];
    this.box.removeModels(toBeRemoved);

    const action = {
      undo: () => {
        this.box.addModels(toBeRemoved);
        toBeRemoved.forEach(el => el.reset());
      },
      redo: () => {
        this.box.removeModels(toBeRemoved);
      }
    };

    this.actionManager.push(action);
  }

  removeModels(models: Model[]) {
    const relations: Set<Model> = new Set(models);

    this.box.each(m => {
      if (m instanceof LinkModel) {
        const startHost = m.getStartHost();
        const endHost = m.getEndHost();
        if (relations.has(startHost) || (endHost && relations.has(endHost))) {
          relations.add(m);
        }
      }
    });
    const toBeRemoved = [...relations];
    this.box.removeModels(toBeRemoved);

    const action = {
      undo: () => {
        this.box.addModels(toBeRemoved);
        toBeRemoved.forEach(el => el.reset());
      },
      redo: () => {
        this.box.removeModels(toBeRemoved);
      }
    };

    this.actionManager.push(action);
  }

  removeSelection() {
    const selected = this.selectionManager.getSelectionList();
    if (selected.length > 0) {
      this.removeModels(selected);
      this.selectionManager.clearSelection();
    }
  }

  getShowPerformance() {
    return this.showPerformance;
  }

  setShowPerformance(bool: boolean) {
    this.showPerformance = bool;
  }

  dispose() {
    this.box.dispose();
    this.eventManager.dispose();
    this.viewportManager.dispose();
    this.actionManager.dispose();
    this.selectionManager.dispose();
    this.grid.dispose();
  }

  getSceneData(): SceneData {
    const models: ModelJson[] = [];
    this.box.each(model => {
      const json = model.toJson();
      models.push(json);
    });
    const viewport = this.viewportManager.getViewport();
    const x = viewport.x;
    const y = viewport.y;
    return {
      models,
      viewport: {
        x,
        y,
        zoom: this.viewportManager.getZoom()
      }
    };
  }

  parseSceneData(jsonObj: SceneData, modelManager: ModelManager) {
    this.box.removeAll();
    const models: Model[] = [];
    jsonObj.models.forEach(json => {
      const model = modelManager.parseJson(json, models);
      models.push(model);
    });
    this.box.addModels(models);
  }
}
