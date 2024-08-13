<template>
  <div :class="bem.b()">
    <div v-if="schema.label" :class="bem.e('label')">{{ schema.label }}</div>
    <div :class="bem.e('content')">
      <template v-if="comp">
        <component v-bind="compAttrs" :model-value="vModel" @update:model-value="handleUpdate" :is="comp"></component>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useNamespace } from '../../../hooks/useNameSpace';
import { computed, onBeforeUnmount, PropType, ref } from 'vue';
import { PropertySchema, useCurrentModel } from './property-panel';
import Position from '../components/position/Position.vue';
import { capitalizeFirstLetter, isEqual } from '@stom/shared';
import { Model } from '@stom/core';
import { useStomStore } from '../store';
import Size from '../components/size/Size.vue';
import ColorPicker from '../components/color-picker/ColorPicker.vue';
import IntInput from '../components/int-input/IntInput.vue';
import Select from '../components/select/Select.vue';

const bem = useNamespace('property-item');

const props = defineProps({
  schema: {
    type: Object as PropType<PropertySchema>,
    required: true
  }
});

const componentMap: Record<string, any> = {
  [Position.name!]: Position,
  [Size.name!]: Size,
  [ColorPicker.name!]: ColorPicker,
  [IntInput.name!]: IntInput,
  [Select.name!]: Select
};

const comp = computed(() => {
  if (typeof props.schema.component === 'string') {
    return componentMap[props.schema.component];
  }
  return props.schema.component;
});

const compAttrs = computed(() => props.schema.componentAttrs || {});

const currentModel = useCurrentModel();
const store = useStomStore();

const getter = () => {
  const model: any = currentModel.value!;
  if (props.schema.getter) {
    return props.schema.getter(model);
  }
  if (props.schema.keyType === 'attr') {
    return model.getAttr(props.schema.key!);
  }
  if (props.schema.keyType === 'base') {
    const fnName = `get${capitalizeFirstLetter(props.schema.key!)}`;
    return model[fnName]();
  }
};

const vModel = ref(getter());

const setValue = (val: any) => {
  const model = currentModel.value!;
  if (props.schema.setter) {
    props.schema.setter(model, val);
  } else if (props.schema.keyType === 'attr') {
    model.setAttr(props.schema.key!, val);
  } else if (props.schema.keyType === 'base') {
    const fnName = `set${capitalizeFirstLetter(props.schema.key!)}`;
    model[fnName](val);
  }
};

const setter = (val: any) => {
  const oldVal = getter();
  if (isEqual(oldVal, val)) return;
  setValue(val);
  const action = {
    undo: () => {
      setValue(oldVal);
    },
    redo: () => {
      setValue(val);
    }
  };
  store.getEditor().actionManager.push(action);
};

const handleUpdate = (val: any) => {
  setter(val);
  vModel.value = getter();
};

const handleWatch = () => {
  vModel.value = getter();
};

if (props.schema.watch) {
  currentModel.value!.on(props.schema.watch as any, handleWatch);
}

onBeforeUnmount(() => {
  currentModel.value!.off(props.schema.watch as any, handleWatch);
});
</script>

<style lang="postcss"></style>
