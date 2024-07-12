<template>
  <div ref="editorRef" :class="[bem.b()]"></div>
</template>

<script setup lang="ts">
import { ShallowRef, markRaw, onMounted, ref } from 'vue';
import { useNamespace } from '../../../hooks/useNameSpace';
import { Editor, Box } from '@stom/core';

defineOptions({ name: 'Editor' });

const emit = defineEmits<{
  (e: 'ready', editor: Editor): void;
}>();

const bem = useNamespace('container');
const editorRef = ref();

const editor: ShallowRef<Editor | undefined> = ref();

onMounted(() => {
  editor.value = markRaw(new Editor(editorRef.value));
  emit('ready', editor.value);
});

const getEditor = () => editor.value;

defineExpose({ getEditor });
</script>
