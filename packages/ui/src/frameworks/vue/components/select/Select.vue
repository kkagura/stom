<template>
  <Popper v-model:visible="visible"></Popper>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useNamespace } from '../../../../hooks/useNameSpace';
import Popper from '../popper/Popper.vue';

defineOptions({
  name: 'Select'
});

const bem = useNamespace('select');

const visible = ref(false);
</script>

<style lang="postcss"></style>
