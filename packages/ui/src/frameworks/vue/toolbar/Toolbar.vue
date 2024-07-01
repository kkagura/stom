<template>
  <div :class="[bem.b()]">
    <ToolbarButton v-for="c in commands" :command="c" :key="c.getName()"></ToolbarButton>
  </div>
</template>

<script setup lang="ts">
import { PropType } from 'vue';
import { useNamespace } from '../../../hooks/useNameSpace';
import { Command } from '@stom/core';
import ToolbarButton from './ToolbarButton.vue';
const bem = useNamespace('toolbar');

defineProps({
  commands: {
    type: Array as PropType<Command[]>,
    required: true
  }
});
</script>

<style lang="postcss"></style>
