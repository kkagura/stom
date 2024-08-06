<template>
  <div :class="bem.b()" :style="sliderStyle">
    <div :class="bem.e('bar')" :style="barStyle"></div>
    <div :class="bem.e('thumb')" :style="thumbStyle"></div>
  </div>
</template>

<script setup lang="ts">
import { useNamespace } from '../../../../hooks/useNameSpace';
import { useColorPickerContext } from './color-picker';
import { computed } from 'vue';

const bem = useNamespace('color-alpha-slider');

const context = useColorPickerContext();
const sliderStyle = computed(() => {
  return {
    width: `${context.state.panelWidth}px`
  };
});

const barStyle = computed(() => {
  return {
    background: `linear-gradient(to right, rgba(0, 0, 0, 0) 0%, rgb(${context.state.rgba.r},${context.state.rgba.g},${context.state.rgba.b}) 100%)`
  };
});

const thumbStyle = computed(() => {
  return {
    width: `${context.state.thumbSize}px`
  };
});
</script>

<style lang="postcss"></style>
