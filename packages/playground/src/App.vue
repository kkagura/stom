<template>
  <div class="editor-page">
    <div class="editor-header">
      <div class="header-toolbar">
        <Toolbar :commands="defaultCommands"></Toolbar>
      </div>
      <div @click="handleClickLogo" class="header-logo">
        <Github class="header-icon"></Github>
        <span>stom</span>
      </div>
    </div>
    <div class="editor-content">
      <Library :group-list="library"></Library>
      <div class="editor-box">
        <Editor @ready="onReady"></Editor>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ShallowRef, markRaw, ref, shallowRef } from 'vue';
// todo: github logo不应该由组件库提供 或者组件库应该提供完整的logo 而不是单独的github icon
import { Editor, Toolbar, createStomStore, getDefaultCommands, Library, getDefaultLibrary, Github } from '@stom/ui/vue';
import { Command, type Editor as IEditor } from '@stom/core';
import { SaveCommand } from './SaveCommand';
import { getSceneJson } from './service';
const defaultCommands = shallowRef<Command[]>([]);

const store = createStomStore();

const library = shallowRef(getDefaultLibrary());
store.register(library.value);

const onReady = (editor: IEditor) => {
  store.setEditor(editor);
  const modelManager = store.getModelManager();
  const data = getSceneJson();
  if (data) {
    editor.parseSceneData(data, modelManager);
  }
  const commands = getDefaultCommands(editor);
  commands.push(new SaveCommand(editor, modelManager));
  defaultCommands.value = markRaw(commands);
};

const handleClickLogo = () => {
  window.open('https://github.com/kkagura/stom');
};
</script>
<style lang="postcss">
.editor-page {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  .editor-header {
    display: flex;
    .header-toolbar {
      flex: 1;
      overflow: hidden;
    }
    .header-logo {
      padding-right: 40px;
      border-top: 1px solid #dfe2e5;
      border-bottom: 1px solid #dfe2e5;
      height: 100%;
      display: flex;
      align-items: center;
      box-sizing: border-box;
      color: #0f8eff;
      font-size: 16px;
      cursor: pointer;
      .header-icon {
        width: 24px;
        height: 24px;
        margin-right: 4px;
      }
    }
  }
  .editor-content {
    flex: 1;
    overflow: hidden;
    display: flex;
    .editor-box {
      flex: 1;
      height: 100%;
      overflow: hidden;
    }
  }
}
</style>
