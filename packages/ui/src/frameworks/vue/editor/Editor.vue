<template>
  <div ref="editorRef" :class="[bem.b()]"></div>
</template>

<script setup lang="ts">
import { ShallowRef, onMounted, ref } from 'vue';
import { useNamespace } from '../../../hooks/useNameSpace';
import { Editor, Box, RectModel } from '@stom/core';

defineOptions({ name: 'Editor' });

const emit = defineEmits<{
  (e: 'ready', editor: Editor): void;
}>();

const bem = useNamespace('container');
const editorRef = ref();
const box = new Box();
const rect1 = new RectModel();
const rect2 = new RectModel();
rect2.setPosition(400, 200);
box.addModel(rect1);
box.addModel(rect2);

const editor: ShallowRef<Editor | undefined> = ref();

onMounted(() => {
  editor.value = new Editor(editorRef.value, box);
  emit('ready', editor.value);
});

const getEditor = () => editor.value;

defineExpose({ getEditor });
</script>
