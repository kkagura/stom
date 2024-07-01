<template>
  <div :class="[bem.e('button'), bem.is('disabled', !isEnable)]" @click="handleClick">
    <Icon>
      <component :is="currentComponent"></component>
    </Icon>
  </div>
</template>

<script setup lang="ts">
import { useNamespace } from '../../../hooks/useNameSpace';
import { Undo, Redo } from '../icons';
import Icon from '../components/icon/Icon.vue';
import { PropType, ref } from 'vue';
import { Command, CommandName } from '@stom/core';
const bem = useNamespace('toolbar');

const props = defineProps({
  command: {
    type: Object as PropType<Command>,
    required: true
  }
});

const iconMap: Record<CommandName, any> = {
  [CommandName.UNDO]: Undo,
  [CommandName.REDO]: Redo
};

const isEnable = ref(!props.command.isEnable());

const currentComponent = iconMap[props.command.getName()];

const handleClick = () => {
  if (props.command.isEnable()) {
    props.command.execute();
  }
};
</script>
