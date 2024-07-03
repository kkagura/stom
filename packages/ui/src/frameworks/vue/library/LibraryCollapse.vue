<template>
  <div :class="[bem.b(), bem.is('collapsed', isCollapsed)]">
    <div @click="toggleCollapse" :class="bem.e('header')">
      <div :class="bem.e('arrow')"></div>
      <div :class="bem.e('title')">{{ title }}</div>
    </div>
    <Transition v-on="transitionOn">
      <div v-show="!isCollapsed" :class="bem.e('content')">
        <slot></slot>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { RendererElement, ref } from 'vue';
import { useNamespace } from '../../../hooks/useNameSpace';
const bem = useNamespace('library-collapse');
defineProps({
  title: {
    type: String,
    required: true
  }
});

const transitionOn = {
  beforeEnter(el: RendererElement) {
    el.style.maxHeight = 0;
  },
  enter(el: RendererElement) {
    el.style.maxHeight = `${el.scrollHeight}px`;
  },
  afterEnter(el: RendererElement) {
    el.style.maxHeight = '';
  },
  beforeLeave(el: RendererElement) {
    el.style.maxHeight = `${el.scrollHeight}px`;
  },
  leave(el: RendererElement) {
    el.style.maxHeight = 0;
  },
  afterLeave(el: RendererElement) {
    el.style.maxHeight = '';
  }
};

const isCollapsed = ref(false);
const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value;
};
</script>
