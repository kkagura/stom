<template>
  <div :class="[bem.b(), bem.has('prepend', hasPrepend), bem.has('append', hasAppend)]">
    <span v-if="hasPrepend" :class="bem.e('prepend')">
      <slot name="prepend">
        <span>{{ prepend }}</span>
      </slot>
    </span>
    <div :class="bem.e('wrapper')">
      <input :value="inputValue" type="text" :class="bem.e('inner')" @input="handleInput" @blur="handleBlur" />
    </div>
    <span v-if="hasAppend" :class="bem.e('append')">
      <slot name="append">
        <span>{{ append }}</span>
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
  prepend: {
    type: String,
    default: ''
  },
  append: {
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

const hasAppend = computed(() => {
  return !!(slots.append || props.append);
});

const hasPrepend = computed(() => {
  return !!(slots.prepend || props.prepend);
});

const handleInput = (e: Event) => {
  let { value } = e.target as HTMLInputElement | HTMLTextAreaElement;
  if (props.formatter) {
    value = props.formatter(value);
  }
  inputValue.value = value;
  emit('update:modelValue', value);
};

const handleBlur = (e: FocusEvent) => {
  emit('blur', e);
};
</script>

<style lang="postcss"></style>
