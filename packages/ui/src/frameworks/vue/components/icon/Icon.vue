<template>
  <div :class="[bem.b()]">
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
defineOptions({
  name: 'Icon'
});

import { useNamespace } from '../../../../hooks/useNameSpace';

const bem = useNamespace('icon');
</script>
