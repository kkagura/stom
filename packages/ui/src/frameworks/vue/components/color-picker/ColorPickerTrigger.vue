<template>
  <div :style="{ backgroundColor: rgba }" @focus="handleFocus" @blur="handleBlur" role="button" :class="bem.b()" tabindex="0"></div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useNamespace } from '../../../../hooks/useNameSpace';
import { useColorPickerContext } from './color-picker';

const bem = useNamespace('color-trigger');

const emit = defineEmits<{
  (e: 'focus', v: Event): void;
  (e: 'blur', v: Event): void;
}>();

const handleFocus = (e: Event) => {
  emit('focus', e);
};

const handleBlur = (e: Event) => {
  emit('blur', e);
};
const context = useColorPickerContext();

const rgba = computed(() => {
  const { r, g, b, a } = context.state.rgba;
  return `rgba(${r},${g},${b},${a})`;
});
</script>

<style lang="postcss"></style>
