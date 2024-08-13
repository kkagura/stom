<template>
  <div :class="[bem.b(), bem.is('selected', isSelected)]">
    <span :class="bem.e('innter')">
      <slot>{{ option.label }}</slot>
    </span>
  </div>
</template>

<script setup lang="ts">
import { PropType } from 'vue';
import { useNamespace } from '../../../../hooks/useNameSpace';
import { SelectOption } from './select';
defineOptions({
  name: 'Option'
});

const bem = useNamespace('option');

const props = defineProps({
  option: {
    type: Object as PropType<SelectOption>,
    required: true
  },
  isSelected: {
    type: Boolean
  }
});
</script>
