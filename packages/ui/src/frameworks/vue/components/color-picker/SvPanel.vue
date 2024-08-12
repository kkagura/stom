<template>
  <div :class="bem.b()" :style="panelStyle" @mousedown="handleMousedown">
    <div :class="bem.e('white')"></div>
    <div :class="bem.e('black')"></div>
    <div :class="bem.e('cursor')" :style="cursorStyle"></div>
  </div>
</template>

<script setup lang="ts">
import { useNamespace } from '../../../../hooks/useNameSpace';
import { useColorPickerContext } from './color-picker';
import { computed, getCurrentInstance } from 'vue';
import { hsvToRgb } from './color-utils';
import { useDragEvent } from '@stom/shared';

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

const instance = getCurrentInstance()!;

const setValueByEvent = (ev: MouseEvent) => {
  const el = instance.vnode.el;
  if (!el) return;
  const rect: DOMRect = el.getBoundingClientRect();
  const { clientY, clientX } = ev;

  let left = clientX - rect.left;
  let top = clientY - rect.top;
  left = Math.max(0, left);
  left = Math.min(left, rect.width);

  top = Math.max(0, top);
  top = Math.min(top, rect.height);
  const saturation = left / rect.width;
  const value = 1 - top / rect.height;

  context.actions.setSV(saturation, value);
  context.actions.updateSVPosition();
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
