<template>
  <div :class="bem.b()">
    <div v-if="schema.label" :class="bem.e('label')">{{ schema.label }}</div>
    <div :class="bem.e('content')">
      <template v-if="comp">
        <component :is="comp"></component>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useNamespace } from '../../../hooks/useNameSpace';
import { computed, PropType } from 'vue';
import { PropertySchema, useCurrentModel } from './property-panel';
import Position from '../components/position/Position.vue';
import { capitalizeFirstLetter } from '@stom/shared';
import { Model } from '@stom/core';

const bem = useNamespace('property-item');

const props = defineProps({
  schema: {
    type: Object as PropType<PropertySchema>,
    required: true
  }
});

const componentMap: Record<string, any> = {
  [Position.name!]: Position
};

const comp = computed(() => {
  if (typeof props.schema.component === 'string') {
    return componentMap[props.schema.component];
  }
  return props.schema.component;
});

const currentModel = useCurrentModel();

const getter = () => {
  const model = currentModel.value!;
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
</script>

<style lang="postcss"></style>
