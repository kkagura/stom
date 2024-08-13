<template>
  <Popper @before-open="isActive = true" @before-close="isActive = false" placement="bottom" v-model:visible="visible">
    <div ref="inputRef" :class="[bem.b(), bem.is('active', isActive)]">
      <Input :model-value="inputValue" @click="handleFocus" readonly>
        <template #suffix>
          <Icon :class="bem.e('arrow')">
            <ArrowDown></ArrowDown>
          </Icon>
        </template>
      </Input>
    </div>
    <template #content>
      <div :style="{ minWidth: minWidth + 'px' }" :class="bem.e('options')">
        <Option :is-selected="el.value === modelValue" @click="handleClick(el)" v-for="el in options" :key="el.value" :option="el"></Option>
      </div>
    </template>
  </Popper>
</template>

<script setup lang="ts">
import { PropType, ref } from 'vue';
import { useNamespace } from '../../../../hooks/useNameSpace';
import Popper from '../popper/Popper.vue';
import Input from '../input/Input.vue';
import { ArrowDown } from '../../icons';
import Icon from '../icon/Icon.vue';
import { SelectOption } from './select';
import Option from './Option.vue';
import { watch } from 'vue';

defineOptions({
  name: 'Select'
});

const bem = useNamespace('select');

const props = defineProps({
  options: {
    type: Array as PropType<SelectOption[]>,
    default: []
  },
  modelValue: {
    type: [String, Number] as PropType<string | number>,
    default: ''
  }
});

const emit = defineEmits(['update:modelValue']);

const isActive = ref(false);

const inputRef = ref<HTMLDivElement>();
const minWidth = ref(0);

const visible = ref(false);
const handleFocus = () => {
  if (!inputRef.value) return;
  const { width } = inputRef.value.getBoundingClientRect();
  minWidth.value = width;
  visible.value = true;
};

const inputValue = ref<number | string>('');
watch(
  [props.modelValue, props.options],
  () => {
    inputValue.value = props.options.find(el => el.value === props.modelValue)?.label || props.modelValue;
  },
  {
    deep: true,
    immediate: true
  }
);

const handleClick = (el: SelectOption) => {
  emit('update:modelValue', el.value);
  visible.value = false;
};
</script>

<style lang="postcss"></style>
