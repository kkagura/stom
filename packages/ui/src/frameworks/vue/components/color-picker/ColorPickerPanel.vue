<template>
  <div ref="panelRef" :class="bem.b()">
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

const panelRef = ref<HTMLElement>();

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

const handleBlur = (e: FocusEvent) => {
  context.actions.setValue(inputValue.value);
};

const handleOk = () => {
  emit('ok', inputValue.value);
};

const getPanelDom = () => panelRef.value;

defineExpose({
  getPanelDom
});
</script>

<style lang="postcss"></style>
