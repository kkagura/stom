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
import { TextInput } from './text-input';
import { AlignManager } from './align-manager';

export interface SceneData {
  version: string;
  models: ModelJson[];
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
}

export class Editor {
  // 最底层canvas 负责绘制背景与网格
  rootCanvas: HTMLCanvasElement;
  private rootCtx: CanvasRenderingContext2D;

  // 主canvas，负责绘制各个图形
  mainCanvas: HTMLCanvasElement;
  private mainCtx: CanvasRenderingContext2D;

  // 顶层canvas，负责绘制选中的图形的边框、吸附线等其它交互相关的效果
  topCanvas: HTMLCanvasElement;
  private topCtx: CanvasRenderingContext2D;

  // 事件管理系统，负责鼠标、键盘事件的监听以及分发
  eventManager: EventManager;
  // 视口管理器，负责管理视口，包括平移、缩放等
  viewportManager: ViewportManager;
  // 操作管理器，负责管理操作历史，包括撤销、重做等
  actionManager: ActionManager;
  // 选中管理器，负责管理选中的图形，包括连选、点选、反选等操作
  selectionManager: SelectionManager;
  // 网格管理器，负责绘制网格
  grid: Grid;

  // 脏列表，记录哪些图形发生了变化，需要重新绘制
  private dirtyList: Set<Model> = new Set();
  // 标记是否全量绘制（当窗口发生平移、缩放时，需要标记全量重绘）
  private paintAll: boolean = true;
  // 在每次图形被重绘时，将其的renderRect缓存起来，用来做脏矩形检测
  private frameRects: Map<string, IRect> = new Map();
  // 插件
  private plugins: EditorPlugin<BasePluginEvents>[] = [];
  // 标记插件是否需要重绘
  private pluginsDirty = true;
  // 标记是否显示性能数据
  private showPerformance: boolean = true;
  // 管理所有图形的容器
  public box = new Box();
  // 编辑文字相关的逻辑
  public textInput = new TextInput(this);
  // 对齐相关逻辑
  public alignManager = new AlignManager(this);

  // todo: 构建时引入
  private version = '1.0.1';

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

    this.grid = new Grid(this);
    this.installPlugin(this.grid);

    this.viewportManager = new ViewportManager(this);
    this.installPlugin(this.viewportManager);
    this.viewportManager.on(CommonEvents.change, () => {
      this.paintAll = true;
      this.pluginsDirty = true;
    });

    this.box.on(BoxEvents.modelsChange, models => {
      models.forEach(m => this.dirtyList.add(m));
    });
    this.box.on(BoxEvents.removeModels, models => {
      models.forEach(m => this.frameRects.delete(m.id));
    });

    this.ready();

    requestAnimationFrame(this.repaint);
  }

  private ready() {
    this.plugins.forEach(p => p.onReady?.());
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

    if (this.paintAll) {
      this.fullRepaint();
    } else if (this.dirtyList.size) {
      this.partRepaint();
    }

    if (this.pluginsDirty) {
      this.paintTop();
      this.paintRoot();
    }

    const time = Date.now() - now;
    if (this.showPerformance) {
      this.paintPerformance(time);
    }

    this.pluginsDirty = false;
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
    // 判断当前是否有需要重绘的元素
    if (this.dirtyList.size === 0)
      return {
        rect: { x: 0, y: 0, width: 0, height: 0 },
        models: new Set()
      };
    // 获取整个视图窗口大小
    const viewRect = this.viewportManager.getViewRect();
    const modelSet = new Set<Model>(this.dirtyList);
    const modelList = this.box.getModelList();
    // 获取所有的renderRect，包含当前帧与上一帧
    const renderRects = [...modelSet].reduce((acc, model) => {
      acc.push(model.getRenderRect());
      const lastRenderRect = this.frameRects.get(model.id);
      if (lastRenderRect) {
        acc.push(lastRenderRect);
      }
      return acc;
    }, [] as IRect[]);
    // 合并所有的renderRect作为初始的矩形
    let dirtyRect = mergeRects(...renderRects);
    for (let i = 0; i < modelList.length; i++) {
      const m = modelList[i];
      // 已经加入队列的元素不参与比较
      if (modelSet.has(m)) continue;
      const renderRect = m.getRenderRect();
      // 不在视图窗口内的元素不考虑
      if (!isRectIntersect(renderRect, viewRect)) continue;
      // 如果与当前帧相交，则需要重绘，将图形加入到重绘队列中
      if (isRectIntersect(renderRect, dirtyRect)) {
        modelSet.add(m);
        dirtyRect = mergeRects(renderRect, dirtyRect);
        // 一旦脏矩形的大小改变了，则重新开始循环
        i = -1;
      }
    }
    return {
      rect: dirtyRect,
      models: modelSet
    };
  }

  partRepaint() {
    // 获取需要重绘的区域大小，与所有需要重绘的元素
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
    // 高清屏处理
    ctx.scale(dpr * zoom, dpr * zoom);
    ctx.translate(dx, dy);

    // 清除重绘区域
    ctx.clearRect(rect.x, rect.y, rect.width, rect.height);

    this.box.each(m => {
      if (models.has(m)) {
        this.paintModel(m, ctx);
      }
    });

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
      version: this.version,
      models,
      viewport: {
        x,
        y,
        zoom: this.viewportManager.getZoom()
      }
    };
  }

  parseSceneData(jsonObj: SceneData, modelManager: ModelManager) {
    if (jsonObj.version !== this.version) {
      console.warn('导入json失败，，版本不匹配');
      return;
    }
    this.box.removeAll();
    const models: Model[] = [];
    jsonObj.models.forEach(json => {
      const model = modelManager.parseJson(json, models);
      models.push(model);
    });
    this.box.addModels(models);
  }

  getShowRuler() {
    return this.grid.getShowRuler();
  }

  setShowRuler(bool: boolean) {
    this.grid.setShowRuler(bool);
  }

  getShowGrid() {
    return this.grid.getShowGrid();
  }

  setShowGrid(bool: boolean) {
    this.grid.setShowGrid(bool);
  }
}
