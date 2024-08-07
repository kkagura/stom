<template>
  <div :class="bem.b()">
    <ColorPickerTrigger ref="triggerRef" @focus="handleOpen" @blur="handleBlur"></ColorPickerTrigger>
    <ColorPickerPanel @ok="handleOk" :enableAlpha="enableAlpha" ref="panelRef"></ColorPickerPanel>
  </div>
</template>

<script setup lang="ts">
import { useNamespace } from '../../../../hooks/useNameSpace';
import ColorPickerTrigger from './ColorPickerTrigger.vue';
import ColorPickerPanel from './ColorPickerPanel.vue';
import { computed, provide, ref } from 'vue';
import { createColorPickerContext, colorPickerContextKey } from './color-picker';
import { findParentDom } from '@stom/shared';

defineOptions({
  name: 'ColorPicker'
});

const bem = useNamespace('color');
const panelRef = ref<InstanceType<typeof ColorPickerPanel>>();
const triggerRef = ref<InstanceType<typeof ColorPickerTrigger>>();

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  enableAlpha: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits<{ (e: 'update:modelValue', value: string) }>();

const context = createColorPickerContext(props.modelValue);
provide(colorPickerContextKey, context);

const handleOpen = () => {
  context.actions.setValue(props.modelValue);
  const triggerRect = triggerRef.value?.$el!.getBoundingClientRect();
  panelRef.value!.open(triggerRect, 'left');
};

const handleBlur = (e: any) => {
  const el = e.relatedTarget as HTMLElement;
  if (el) {
    const panel = findParentDom(el, el => el === panelRef.value!.getPanelDom());
    if (panel) {
      return;
    }
  }
  panelRef.value!.close();
};

const handleOk = (value: string) => {
  emit('update:modelValue', value);
  panelRef.value!.close();
};
</script>
