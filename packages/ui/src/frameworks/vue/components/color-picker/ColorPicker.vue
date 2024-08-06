<template>
  <div :class="bem.b()">
    <ColorPickerTrigger ref="triggerRef" @focus="handleOpen" @blur="handleBlur"></ColorPickerTrigger>
    <ColorPickerPanel ref="panelRef"></ColorPickerPanel>
  </div>
</template>

<script setup lang="ts">
import { useNamespace } from '../../../../hooks/useNameSpace';
import ColorPickerTrigger from './ColorPickerTrigger.vue';
import ColorPickerPanel from './ColorPickerPanel.vue';
import { provide, ref } from 'vue';
import { createColorPickerContext, colorPickerContextKey } from './color-picker';

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
  }
});

const context = createColorPickerContext(props.modelValue, true);
provide(colorPickerContextKey, context);

const handleOpen = () => {
  const triggerRect = triggerRef.value?.$el!.getBoundingClientRect();
  panelRef.value!.open(triggerRect, 'left');
};

const handleBlur = () => {
  // panelRef.value!.close();
};
</script>
