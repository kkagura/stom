<template>
  <div :class="bem.b()" @mousedown="handleMousedown" :style="sliderStyle">
    <div :class="bem.e('bar')"></div>
    <div :class="bem.e('thumb')" :style="thumbStyle"></div>
  </div>
</template>

<script setup lang="ts">
import { useNamespace } from '../../../../hooks/useNameSpace';
import { useColorPickerContext } from './color-picker';
import { computed, getCurrentInstance } from 'vue';
import { useDragEvent } from '@stom/shared';

const bem = useNamespace('color-hue-slider');

const context = useColorPickerContext();
const sliderStyle = computed(() => {
  return {
    height: `${context.state.panelHeight}px`
  };
});

const thumbStyle = computed(() => {
  return {
    height: `${context.state.thumbSize}px`,
    top: `${context.state.huePos.y}px`
  };
});

const instance = getCurrentInstance()!;

const setValueByEvent = (ev: MouseEvent) => {
  const el = instance.vnode.el;
  if (!el) return;
  const rect: DOMRect = el.getBoundingClientRect();
  const { clientY } = ev;
  const size = context.state.thumbSize;

  let top = clientY - rect.top;

  top = Math.min(top, rect.height - size / 2);
  top = Math.max(size / 2, top);
  const hue = (top - size / 2) / (rect.height - size);

  context.actions.setHue(hue);
  context.actions.updateHuePosition();
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
