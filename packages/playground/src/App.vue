<template>
  <div class="editor-page">
    <div class="editor-header">
      <Toolbar :commands="defaultCommands"></Toolbar>
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
import { Editor, Toolbar, createStomStore, getDefaultCommands, Library, getDefaultLibrary } from '@stom/ui/vue';
import { Command, type Editor as IEditor } from '@stom/core';
// todo: fix type
// const defaultCommands = ref<Command[]>([]);
const defaultCommands = shallowRef<any[]>([]);

const store = createStomStore();

const library = shallowRef(getDefaultLibrary());
store.register(library.value);

const onReady = (e: IEditor) => {
  store.setEditor(e);
  defaultCommands.value = markRaw(getDefaultCommands(e));
};
</script>
<style lang="postcss">
.editor-page {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
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
