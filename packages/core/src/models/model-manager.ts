import { LinkModel } from './link-model';
import { ModelJson, ModelClass, type Model } from './model';

export class ModelManager {
  private classMap: Map<string, ModelClass> = new Map();

  constructor() {
    this.register(LinkModel);
  }

  register(modelClass: ModelClass) {
    this.classMap.set(modelClass.CATEGORY, modelClass);
  }

  getInstance(category: string, id?: string) {
    const modelClass = this.classMap.get(category);
    if (!modelClass) {
      throw new Error(`${category} is not registered`);
    }
    return new modelClass(id);
  }

  parseJson(json: ModelJson, models: Model[]) {
    const modelClass = this.classMap.get(json.category);
    if (!modelClass) {
      throw new Error(`${json.category} is not registered`);
    }
    return modelClass.fromJson(json, models, modelClass);
  }
}
