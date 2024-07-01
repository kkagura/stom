<template>
  <div class="page">
    <div class="toolbar-container">
      <Toolbar :commands="defaultCommands"></Toolbar>
    </div>
    <div class="main-content">
      <Editor @ready="onReady"></Editor>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ShallowRef, markRaw, ref, shallowRef } from 'vue';
import { Editor, Toolbar } from '@stom/ui/vue';
import { Command, getDefaultCommands, type Editor as IEditor } from '@stom/core';
// todo: fix type
// const defaultCommands = ref<Command[]>([]);
const defaultCommands = shallowRef<any[]>([]);

const editor: ShallowRef<IEditor | undefined> = ref();

const onReady = (e: IEditor) => {
  editor.value = e;
  defaultCommands.value = markRaw(getDefaultCommands(e));
};
</script>
<style lang="postcss">
.page {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  .main-content {
    flex: 1;
    overflow: hidden;
  }
}
</style>
