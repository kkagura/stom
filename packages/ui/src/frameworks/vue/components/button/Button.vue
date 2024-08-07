<template>
  <button @click="handleClick" :class="[bem.b()]">
    <slot></slot>
  </button>
</template>

<script setup lang="ts">
import { useNamespace } from '../../../../hooks/useNameSpace';
const bem = useNamespace('button');

const props = defineProps({
  disabled: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits<{
  (e: 'click', ev: MouseEvent): void;
}>();

const handleClick = (e: MouseEvent) => {
  if (!props.disabled) {
    emit('click', e);
  }
};
</script>

<style lang="postcss"></style>
