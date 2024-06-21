import { EventEmitter } from '@stom/shared';
import { Model } from './models/model';

export enum LayerEvents {
  addModel = 'addModel',
  removeModel = 'removeModel',
  change = 'change'
}

interface Events {
  [LayerEvents.addModel]: (m: Model) => void;
  [LayerEvents.removeModel]: (m: Model) => void;
  [LayerEvents.change]: () => void;
}

export class Layer extends EventEmitter<Events> {
  modelList: Model[] = [];
  modelMap: Map<string, Model> = new Map();

  constructor(public name: string) {
    super();
  }
  addModel(model: Model) {
    if (this.modelMap.has(model.id)) return;
    this.modelList.push(model);
    this.modelMap.set(model.id, model);
    this.emit(LayerEvents.addModel, model);
  }

  removeModel(model: Model) {
    if (!this.modelMap.has(model.id)) return;
    this.modelList = this.modelList.filter(m => m.id !== model.id);
    this.modelMap.delete(model.id);
    this.emit(LayerEvents.removeModel, model);
    model.dispose();
  }

  dispose() {
    this.clear();
  }
}
