<template>
  <Teleport to="body">
    <div v-if="visible" :class="bem.e('mask')">
      <div ref="panelRef" :style="panelStyle" :class="bem.b()">
        <div :class="bem.e('main')">
          <SvPanel></SvPanel>
          <HueSlider></HueSlider>
        </div>
        <AlphaSlider></AlphaSlider>
        <div :class="bem.e('btns')">
          <Input v-model="inputValue" @blur="handleBlur"></Input>
          <Button @click="handleOk">确认</Button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, nextTick, watch } from 'vue';
import { useNamespace } from '../../../../hooks/useNameSpace';
import SvPanel from './SvPanel.vue';
import HueSlider from './HueSlider.vue';
import AlphaSlider from './AlphaSlider.vue';
import Input from '../input/Input.vue';
import Button from '../button/Button.vue';
import { useColorPickerContext } from './color-picker';

const bem = useNamespace('color-panel');

const props = defineProps({
  enableAlpha: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits<{ (e: 'ok', value: string): void }>();

const context = useColorPickerContext();
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

const inputValue = ref('');
watch(
  [() => context.state.rgba, () => context.state.hsv],
  () => {
    if (props.enableAlpha) {
      const { r, g, b, a } = context.state.rgba;
      inputValue.value = `rgba(${r}, ${g}, ${b}, ${a})`;
    } else {
      inputValue.value = context.state.hex;
    }
  },
  {
    immediate: true,
    deep: true
  }
);

const handleBlur = () => {
  context.actions.setValue(inputValue.value);
};

const handleOk = () => {
  emit('ok', inputValue.value);
};

const getPanelDom = () => panelRef.value;

defineExpose({
  open,
  close,
  getPanelDom
});
</script>

<style lang="postcss"></style>
