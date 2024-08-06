<template>
  <div @focus="handleFocus" @blur="handleBlur" role="button" :class="bem.b()" tabindex="0"></div>
</template>

<script setup lang="ts">
import { useNamespace } from '../../../../hooks/useNameSpace';

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
</script>

<style lang="postcss"></style>
