<template>
  <div
    @mousedown="handleMousedown"
    :title="label"
    :class="[bem.e('button'), bem.is('disabled', !isEnable), bem.is('active', isActive)]"
    @click="handleClick"
  >
    <Icon>
      <component :is="currentComponent"></component>
    </Icon>
  </div>
</template>

<script setup lang="ts">
import { useNamespace } from '../../../hooks/useNameSpace';
import {
  Undo,
  Redo,
  ZoomOut,
  ZoomIn,
  Delete,
  Performance,
  Save,
  AlignTop,
  AlignBottom,
  AlignLeft,
  AlignRight,
  AlignHorizontalCenter,
  AlignVerticalCenter
} from '../icons';
import Icon from '../components/icon/Icon.vue';
import { PropType, onBeforeUnmount, ref } from 'vue';
import { Command, CommonEvents } from '@stom/core';
const bem = useNamespace('toolbar');

const props = defineProps({
  command: {
    type: Object as PropType<Command>,
    required: true
  },
  getIcon: {
    type: Function as PropType<(command: string) => any>
  }
});

const iconMap: Record<string, any> = {
  undo: Undo,
  redo: Redo,
  zoomOut: ZoomOut,
  zoomIn: ZoomIn,
  delete: Delete,
  performance: Performance,
  save: Save,
  alignTop: AlignTop,
  alignBottom: AlignBottom,
  alignLeft: AlignLeft,
  alignRight: AlignRight,
  alignHorizontalCenter: AlignHorizontalCenter,
  alignVerticalCenter: AlignVerticalCenter
};

const currentComponent = props.getIcon?.(props.command.getName()) || iconMap[props.command.getName()];
const isEnable = ref(props.command.isEnable());
const isActive = ref(props.command.isActive());
const label = props.command.getLabel();

const handleMousedown = (e: MouseEvent) => {
  if (document.activeElement?.tagName.toLowerCase() === 'canvas') {
    // 点击工具栏的时候不让画布失去焦点
    e.preventDefault();
  }
};

const handleClick = () => {
  if (isEnable.value) {
    props.command.execute();
  }
};

const onChange = () => {
  isEnable.value = props.command.isEnable();
  isActive.value = props.command.isActive();
};

props.command.on(CommonEvents.change, onChange);
onBeforeUnmount(() => {
  props.command.off(CommonEvents.change, onChange);
});
</script>
