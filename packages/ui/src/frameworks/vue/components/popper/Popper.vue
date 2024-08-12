<template>
  <div :class="bem.b()">
    <div ref="referenceRef" :class="bem.e('reference')">
      <slot></slot>
    </div>
    <Teleport to="body">
      <div v-if="visible" ref="popperRef" :class="bem.e('content')">
        <slot name="content"></slot>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { useNamespace } from '../../../../hooks/useNameSpace';
import { computed, ref, useSlots, watch } from 'vue';
import { usePopper } from './popper';
import { PropType } from 'vue';
import type { Placement } from '@popperjs/core';
import { onClickOutside } from '@vueuse/core';

defineOptions({
  name: 'Popper'
});

const props = defineProps({
  visible: Boolean,
  placement: {
    type: String as PropType<Placement>,
    default: 'left'
  }
});

const emit = defineEmits<{
  (e: 'clickOutSide'): void;
  (e: 'update:visible', value: boolean): void;
}>();

const bem = useNamespace('popper');

const referenceRef = ref<HTMLElement>();
const popperRef = ref<HTMLElement>();
const options = computed(() => {
  return {
    placement: props.placement
  };
});
const { update } = usePopper(referenceRef, popperRef, options);

watch(
  () => props.visible,
  () => {
    update();
  },
  {
    immediate: true
  }
);

onClickOutside(popperRef, () => {
  emit('update:visible', false);
  emit('clickOutSide');
});
</script>

<style lang="postcss"></style>
