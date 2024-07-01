<template>
  <div :class="[bem.be()]">
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import { useNamespace } from '../../../../hooks/useNameSpace';

const bem = useNamespace('icon');
</script>
