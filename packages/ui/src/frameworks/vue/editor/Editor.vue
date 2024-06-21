<template>
  <div ref="editorRef" :class="[bem.b()]"></div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useNamespace } from '../../../hooks/useNameSpace';
import { Editor, Box, RectModel } from '@stom/core';

const bem = useNamespace('container');
const editorRef = ref();
const box = new Box();
const rect1 = new RectModel();
box.addModel(rect1);
console.log(rect1);

onMounted(() => {
  const editor = new Editor(editorRef.value, box);
});
</script>
