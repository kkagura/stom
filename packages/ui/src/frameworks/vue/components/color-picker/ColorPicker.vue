<template>
  <Popper @click-out-side="handleClickOutSide" v-model:visible="visible">
    <div :class="bem.b()">
      <ColorPickerTrigger ref="triggerRef" @focus="handleOpen"></ColorPickerTrigger>
    </div>
    <template #content>
      <ColorPickerPanel @ok="handleOk" :enableAlpha="enableAlpha" ref="panelRef"></ColorPickerPanel>
    </template>
  </Popper>
</template>

<script setup lang="ts">
import { useNamespace } from '../../../../hooks/useNameSpace';
import ColorPickerTrigger from './ColorPickerTrigger.vue';
import ColorPickerPanel from './ColorPickerPanel.vue';
import { computed, provide, ref } from 'vue';
import { createColorPickerContext, colorPickerContextKey } from './color-picker';
import { findParentDom } from '@stom/shared';
import Popper from '../popper/Popper.vue';
import { nextTick } from 'vue';

defineOptions({
  name: 'ColorPicker'
});

const bem = useNamespace('color');
const panelRef = ref<InstanceType<typeof ColorPickerPanel>>();
const triggerRef = ref<InstanceType<typeof ColorPickerTrigger>>();

const visible = ref(false);

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

const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>();

const context = createColorPickerContext(props.modelValue);
provide(colorPickerContextKey, context);

const handleOpen = () => {
  context.actions.setValue(props.modelValue);
  visible.value = true;
};

const handleClickOutSide = () => {
  emit('update:modelValue', context.state.currentValue);
};

const handleOk = (value: string) => {
  emit('update:modelValue', value);
  visible.value = false;
};
</script>
