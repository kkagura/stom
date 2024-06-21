<template>
  <div class="page">
    <Editor></Editor>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Editor } from '@stom/ui/vue';
</script>
<style>
.page {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}
</style>
