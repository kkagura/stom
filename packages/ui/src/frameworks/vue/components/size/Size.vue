<template>
  <div :class="[bem.b()]">
    <Input v-model="modelValue[0]" @blur="handlerBlur" prefix="W" suffix="px"></Input>
    <Input v-model="modelValue[1]" @blur="handlerBlur" prefix="H" suffix="px"></Input>
  </div>
</template>

<script setup lang="ts">
import { useNamespace } from '../../../../hooks/useNameSpace';
import Input from '../input/Input.vue';
import { toNumber } from '@stom/shared';
import { nextTick, PropType, ref, watch } from 'vue';

defineOptions({
  name: 'Size'
});

const bem = useNamespace('size');

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

const handlerBlur = async () => {
  modelValue0.value = Math.max(20, toNumber(modelValue0.value));
  modelValue1.value = Math.max(20, toNumber(modelValue1.value));
  emit('update:modelValue', [modelValue0.value, modelValue1.value]);
};
</script>

<style lang="postcss"></style>
