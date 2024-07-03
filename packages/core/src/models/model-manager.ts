import { Model } from './model';

export interface ModelClass {
  CATEGORY: string;
  new (id?: string): Model;
}

export class ModelManager {
  private classMap: Map<string, ModelClass> = new Map();

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
}
