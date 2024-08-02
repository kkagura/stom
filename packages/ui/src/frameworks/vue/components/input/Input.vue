<template>
  <div :class="[bem.b(), bem.has('prefix', hasPrefix), bem.has('suffix', hasSuffix)]">
    <span v-if="hasPrefix" :class="bem.e('prefix')">
      <slot name="prefix">
        <span>{{ prefix }}</span>
      </slot>
    </span>
    <div :class="bem.e('wrapper')">
      <input :value="inputValue" type="text" :class="bem.e('inner')" @input="handleInput" @blur="handleBlur" />
    </div>
    <span v-if="hasSuffix" :class="bem.e('suffix')">
      <slot name="suffix">
        <span>{{ suffix }}</span>
      </slot>
    </span>
  </div>
</template>

<script setup lang="ts">
import { useNamespace } from '../../../../hooks/useNameSpace';
import { computed, ref, useSlots, watch } from 'vue';

defineOptions({
  name: 'Input'
});

const bem = useNamespace('input');

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
  },
  formatter: {
    type: Function,
    required: false
  }
});

const emit = defineEmits(['update:modelValue', 'blur']);

const inputValue = ref('');

watch(
  () => props.modelValue,
  () => {
    inputValue.value = String(props.modelValue ?? '');
  },
  {
    immediate: true
  }
);

const slots = useSlots();

const hasSuffix = computed(() => {
  return !!(slots.suffix || props.suffix);
});

const hasPrefix = computed(() => {
  return !!(slots.prefix || props.prefix);
});

const handleInput = (e: Event) => {
  let { value } = e.target as HTMLInputElement | HTMLTextAreaElement;
  if (props.formatter) {
    value = props.formatter(value);
  }
  inputValue.value = value;
  emit('update:modelValue', value);
};

const handleBlur = () => {
  emit('blur');
};
</script>

<style lang="postcss"></style>
