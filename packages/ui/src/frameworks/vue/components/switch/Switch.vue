<template>
  <div :class="[bem.b(), bem.is('active', modelValue)]">
    <div @click="toggle(!modelValue)" :class="bem.e('wrapper')">
      <div :class="bem.e('action')"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({
  name: 'Switch'
});

import { useNamespace } from '../../../../hooks/useNameSpace';

const bem = useNamespace('switch');

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits<{ (e: 'update:modelValue', value: boolean): void }>();

const toggle = (value: boolean) => {
  emit('update:modelValue', value);
};
</script>

<style lang="postcss"></style>
