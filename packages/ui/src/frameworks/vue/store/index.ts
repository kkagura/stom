import { Editor, ModelManager } from '@stom/core';
import { InjectionKey, inject, provide } from 'vue';
import { ModelGroup } from '../library/library';

interface State {
  editor: Editor | null;
  modelManager: ModelManager;
}
export interface StomStore {
  setEditor(editor: Editor): void;
  getEditor(): Editor;

  register(groups: ModelGroup[]): void;

  getModelManager(): ModelManager;

  ready(): Promise<Editor>;
}

export const stomStoreInjectionKey: InjectionKey<StomStore> = Symbol();

export function createStomStore(): StomStore {
  const promiseCb: Function[] = [];

  const state: State = {
    editor: null,
    modelManager: new ModelManager()
  };

  const store: StomStore = {
    setEditor(editor: Editor) {
      state.editor = editor;
      promiseCb.forEach(resolve => {
        resolve(editor);
      });
      promiseCb.length = 0;
    },

    getEditor() {
      if (!state.editor) {
        throw new Error('editor is not init');
      }
      return state.editor;
    },

    getModelManager() {
      return state.modelManager;
    },

    register(groups: ModelGroup[]) {
      groups.forEach(el => {
        el.models.forEach(model => {
          state.modelManager.register(model);
        });
      });
    },

    ready() {
      return new Promise(resolve => {
        if (state.editor) {
          resolve(state.editor);
        } else {
          promiseCb.push(resolve);
        }
      });
    }
  };
  provide(stomStoreInjectionKey, store);
  return store;
}

export function useStomStore(): StomStore {
  const store = inject(stomStoreInjectionKey, undefined);
  if (!store) {
    throw new Error('store is not init');
  }
  return store;
}
