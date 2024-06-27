<template>
  <div class="page">
    <div class="toolbar-container"></div>
    <div class="main-content">
      <Editor></Editor>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Editor } from '@stom/ui/vue';
</script>
<style lang="postcss">
.page {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  .toolbar-container {
    height: 50px;
  }
  .main-content {
    flex: 1;
    overflow: hidden;
  }
}
</style>
