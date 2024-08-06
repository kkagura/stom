<template>
  <div :class="bem.b()" :style="panelStyle">
    <div :class="bem.e('white')"></div>
    <div :class="bem.e('black')"></div>
    <div :class="bem.e('cursor')" :style="cursorStyle"></div>
  </div>
</template>

<script setup lang="ts">
import { useNamespace } from '../../../../hooks/useNameSpace';
import { useColorPickerContext } from './color-picker';
import { computed } from 'vue';
import { hsvToRgb } from './color-utils';

const bem = useNamespace('color-svpanel');

const context = useColorPickerContext();

const panelStyle = computed(() => {
  const { r, g, b } = hsvToRgb(context.state.hsv.h, 1, 1);
  return {
    width: `${context.state.panelWidth}px`,
    height: `${context.state.panelHeight}px`,
    background: `rgb(${r}, ${g}, ${b})`
  };
});

const cursorStyle = computed(() => {
  return {
    width: context.state.cursorSize + 'px',
    height: context.state.cursorSize + 'px',
    left: context.state.svPos.x + 'px',
    top: context.state.svPos.y + 'px'
  };
});
</script>

<style lang="postcss"></style>
