import { EventEmitter, arrayRemove, warn } from '@stom/shared';
import { Model, ModelEvents } from './models/model';
import { Layer } from './layer';
import { CommonEvents } from './models/common-events';

export enum BoxEvents {
  addModels = 'add-models',
  removeModels = 'remove-models',
  modelsChange = 'change'
}

interface Events {
  [BoxEvents.addModels]: (ms: Model[]) => void;
  [BoxEvents.removeModels]: (ms: Model[]) => void;
  [BoxEvents.modelsChange]: (ms: Model[]) => void;
}

export class Box extends EventEmitter<Events> {
  private modelList: Model[] = [];
  private modelMap: Map<string, Model> = new Map();

  private layerList: Layer[] = [];
  private layerMap: Map<string, Layer> = new Map();

  constructor() {
    super();
    const defaultLayer = new Layer('default');
    this.addLayer(defaultLayer);
  }

  addLayer(layer: Layer) {
    if (layer.modelList.length > 0) {
      warn('添加图层失败，请先清空图层中已有的模型!');
      return;
    }
    if (this.layerMap.has(layer.name)) return;
    this.layerList.push(layer);
    this.layerMap.set(layer.name, layer);
  }

  removeLayer(name) {
    const layer = this.getLayer(name);
    if (!layer) return;
    if (layer.name === 'default') return;
    this.layerList = this.layerList.filter(l => l.name !== name);
    this.layerMap.delete(name);
    layer.modelList.forEach(model => {
      this.modelList = this.modelList.filter(m => m.id !== model.id);
      this.modelMap.delete(model.id);
    });
    this.emit(BoxEvents.removeModels, layer.modelList);
    this.emit(BoxEvents.modelsChange, layer.modelList);
    layer.dispose();
  }

  getLayer(name) {
    return this.layerMap.get(name) || null;
  }

  getDefaultLayer() {
    return this.getLayer('default')!;
  }

  private _addModels(models: Model[]) {
    models.forEach(model => {
      const layerId = model.getLayerId();
      let layer = this.getLayer(layerId);
      if (!layer) {
        layer = this.getDefaultLayer();
        model.setLayerId('default');
      }
      model.on(CommonEvents.change, () => {
        this.emit(BoxEvents.modelsChange, [model]);
      });
      this.modelMap.set(model.id, model);
      this.modelList.push(model);
      layer.addModel(model);
    });
  }

  addModel(model: Model) {
    this._addModels([model]);
    this.emit(BoxEvents.addModels, [model]);
    this.emit(BoxEvents.modelsChange, [model]);
  }

  addModels(models: Model[]) {
    this._addModels(models);
    this.emit(BoxEvents.addModels, models);
    this.emit(BoxEvents.modelsChange, models);
  }

  private _removeModels(models: Model[]) {
    models.forEach(model => {
      if (!this.modelMap.has(model.id)) return;
      const layerId = model.getLayerId();
      const layer = this.getLayer(layerId);
      if (!layer) return;
      layer.removeModel(model);
      this.modelMap.delete(model.id);
      arrayRemove(this.modelList, model);
    });
  }

  removeModel(model: Model) {
    this._removeModels([model]);
    this.emit(BoxEvents.removeModels, [model]);
    this.emit(BoxEvents.modelsChange, [model]);
  }

  removeModels(models: Model[]) {
    this._removeModels(models);
    this.emit(BoxEvents.removeModels, models);
    this.emit(BoxEvents.modelsChange, models);
  }

  each(cb: (model: Model, layer: Layer) => void | boolean) {
    for (let i = 0; i <= this.layerList.length - 1; i++) {
      const layer = this.layerList[i];
      for (let j = 0; j <= layer.modelList.length - 1; j++) {
        const model = layer.modelList[j];
        const res = cb(model, layer);
        if (res === true) return;
      }
    }
  }

  reverseEach(cb: (model: Model, layer: Layer) => void | boolean) {
    for (let i = this.layerList.length - 1; i >= 0; i--) {
      const layer = this.layerList[i];
      for (let j = layer.modelList.length - 1; j >= 0; j--) {
        const model = layer.modelList[j];
        const res = cb(model, layer);
        if (res === true) return;
      }
    }
  }

  has(m: Model) {
    return this.modelMap.has(m.id);
  }

  getModelList() {
    return this.modelList;
  }

  dispose() {
    this.modelList.forEach(m => m.dispose());
    this.modelList = [];
    this.modelMap.clear();
    this.layerList.forEach(l => l.dispose());
    this.layerList = [];
    this.layerMap.clear();
    this.clear();
  }
}
