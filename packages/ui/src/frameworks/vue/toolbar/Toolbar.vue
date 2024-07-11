<template>
  <div :class="[bem.b()]">
    <ToolbarButton :get-icon="getIcon" v-for="c in commands" :command="c" :key="c.getName()"></ToolbarButton>
  </div>
</template>

<script setup lang="ts">
import { PropType } from 'vue';
import { useNamespace } from '../../../hooks/useNameSpace';
import { Command } from '@stom/core';
import ToolbarButton from './ToolbarButton.vue';
const bem = useNamespace('toolbar');

defineOptions({ name: 'Toolbar' });

defineProps({
  commands: {
    type: Array as PropType<Command[]>,
    required: true
  },
  getIcon: {
    type: Function as PropType<(command: string) => any>
  }
});
</script>

<style lang="postcss"></style>
