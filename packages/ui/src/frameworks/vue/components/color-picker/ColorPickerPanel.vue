<template>
  <Teleport to="body">
    <div v-if="visible" :class="bem.e('mask')">
      <div ref="panelRef" :style="panelStyle" :class="bem.b()">
        <div :class="bem.e('main')">
          <SvPanel></SvPanel>
          <HueSlider></HueSlider>
        </div>
        <AlphaSlider></AlphaSlider>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, nextTick } from 'vue';
import { useNamespace } from '../../../../hooks/useNameSpace';
import SvPanel from './SvPanel.vue';
import HueSlider from './HueSlider.vue';
import AlphaSlider from './AlphaSlider.vue';

const bem = useNamespace('color-panel');

const visible = ref(false);
const left = ref(0);
const top = ref(0);
const opacity = ref(0);
const panelStyle = computed(() => {
  return { left: left.value + 'px', top: top.value + 'px', opacity: opacity.value };
});

const open = async (triggerRect: DOMRect, position: 'left' | 'right' | 'bottom' | 'top') => {
  // todo: 判断边界
  opacity.value = 0;
  visible.value = true;
  await nextTick();
  // todo: 其它方向
  if (position === 'left') {
    openOnLeft(triggerRect);
  }
};

const close = async () => {
  opacity.value = 0;
  visible.value = false;
};

const panelRef = ref<HTMLElement>();

const openOnLeft = (triggerRect: DOMRect) => {
  const { width, height } = panelRef.value!.getBoundingClientRect();
  let t = triggerRect.top + triggerRect.height / 2 - height / 2;
  if (t < 0) {
    t = 10;
  }

  let l = triggerRect.left - width - 10;
  if (l < 0) {
    l = 10;
  }
  top.value = t;
  left.value = l;
  opacity.value = 1;
};

defineExpose({
  open,
  close
});
</script>

<style lang="postcss"></style>
