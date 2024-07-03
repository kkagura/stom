<template>
  <div :class="[bem.b()]">
    <ToolbarButton v-for="c in commands" :command="c" :key="c.getName()"></ToolbarButton>
  </div>
</template>

<script setup lang="ts">
import { PropType, onBeforeUnmount, watch } from 'vue';
import { useNamespace } from '../../../hooks/useNameSpace';
import { Command, CommandManager, CommandName } from '@stom/core';
import ToolbarButton from './ToolbarButton.vue';
const bem = useNamespace('toolbar');

defineOptions({ name: 'Toolbar' });

defineProps({
  commands: {
    type: Array as PropType<Command[]>,
    required: true
  }
});
</script>

<style lang="postcss"></style>
