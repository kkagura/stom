<template>
  <div :class="[bem.b()]">
    <Input v-model="modelValue[0]" @blur="handlerBlur" @formatter="toNumber" prefix="X" suffix="px"></Input>
    <Input v-model="modelValue[1]" @blur="handlerBlur" @formatter="toNumber" prefix="Y" suffix="px"></Input>
  </div>
</template>

<script setup lang="ts">
import { useNamespace } from '../../../../hooks/useNameSpace';
import Input from '../input/Input.vue';
import { toNumber } from '@stom/shared';
import { PropType, ref, watch } from 'vue';

defineOptions({
  name: 'Position'
});

const props = defineProps({
  modelValue: {
    type: Array as unknown as PropType<[number, number]>,
    required: true
  }
});

const emit = defineEmits(['update:modelValue']);
const modelValue0 = ref(props.modelValue[0]);
const modelValue1 = ref(props.modelValue[1]);
watch(
  () => props.modelValue,
  () => {
    modelValue0.value = props.modelValue[0];
    modelValue1.value = props.modelValue[1];
  },
  {
    deep: true
  }
);

const handlerBlur = () => {
  if (modelValue0.value !== props.modelValue[0] || modelValue1.value !== props.modelValue[1]) {
    emit('update:modelValue', [modelValue0.value, modelValue1.value]);
  }
};

const bem = useNamespace('position');
</script>

<style lang="postcss"></style>
