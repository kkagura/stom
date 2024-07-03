import { Editor } from '@stom/core';
import { InjectionKey, inject, provide } from 'vue';

export interface StomStore {
  state: {
    editor: Editor | null;
  };

  setEditor(editor: Editor): void;
  getEditor(): Editor;

  ready(): Promise<Editor>;
}

export const stomStoreInjectionKey: InjectionKey<StomStore> = Symbol();

export function createStomStore(): StomStore {
  const promiseCb: Function[] = [];
  const store: StomStore = {
    state: {
      editor: null
    },
    setEditor(editor: Editor) {
      store.state.editor = editor;
      promiseCb.forEach(resolve => {
        resolve(editor);
      });
      promiseCb.length = 0;
    },
    getEditor() {
      if (!store.state.editor) {
        throw new Error('editor is not init');
      }
      return store.state.editor;
    },
    ready() {
      return new Promise(resolve => {
        if (store.state.editor) {
          resolve(store.state.editor);
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
