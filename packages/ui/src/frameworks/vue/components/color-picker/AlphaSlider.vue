<template>
  <div @mousedown="handleMousedown" :class="bem.b()" :style="sliderStyle">
    <div :class="bem.e('bar')" :style="barStyle"></div>
    <div :class="bem.e('thumb')" :style="thumbStyle"></div>
  </div>
</template>

<script setup lang="ts">
import { useDragEvent } from '@stom/shared';
import { useNamespace } from '../../../../hooks/useNameSpace';
import { useColorPickerContext } from './color-picker';
import { computed, getCurrentInstance } from 'vue';

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
    width: `${context.state.thumbSize}px`,
    left: `${context.state.alphaPos.x}px`
  };
});

const instance = getCurrentInstance()!;

const setValueByEvent = (ev: MouseEvent) => {
  const el = instance.vnode.el;
  if (!el) return;
  const rect: DOMRect = el.getBoundingClientRect();
  const { clientX } = ev;
  const size = context.state.thumbSize;

  let left = clientX - rect.left;

  left = Math.min(left, rect.width - size / 2);
  left = Math.max(size / 2, left);
  const alpha = (left - size / 2) / (rect.width - size);

  context.actions.setAlpha(alpha);
  context.actions.updateAlphaPosition();
  context.actions.refreshValue();
};

const handleMousedown = (ev: MouseEvent) => {
  ev.preventDefault();
  useDragEvent(
    {
      onDragMove(e) {
        setValueByEvent(e);
      },
      onUp(e) {
        setValueByEvent(e);
      }
    },
    ev
  );
};
</script>

<style lang="postcss"></style>
