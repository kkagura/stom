<template>
  <Input :prefix="prefix" :suffix="suffix" v-model="vModel" @blur="handleBlur"></Input>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import Input from '../input/Input.vue';
import { toInt } from '@stom/shared';

defineOptions({
  name: 'IntInput'
});

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: ''
  },
  prefix: {
    type: String,
    default: ''
  },
  suffix: {
    type: String,
    default: ''
  }
});

const emit = defineEmits<{ (e: 'update:modelValue', val: any): void }>();

const vModel = ref(props.modelValue);

watch(
  () => props.modelValue,
  () => {
    vModel.value = props.modelValue;
  }
);

const handleBlur = () => {
  vModel.value = toInt(vModel.value);
  emit('update:modelValue', vModel.value);
};
</script>
