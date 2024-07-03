<template>
  <div :class="[bem.b()]"></div>
</template>

<script setup lang="ts">
import { PropType } from 'vue';
import { useNamespace } from '../../../hooks/useNameSpace';
import { ModelGroup } from './library';

defineOptions({ name: 'Library' });

const bem = useNamespace('library');

defineProps({
  groupList: {
    type: Array as PropType<ModelGroup[]>,
    default: () => []
  }
});
</script>

<style lang="postcss"></style>
