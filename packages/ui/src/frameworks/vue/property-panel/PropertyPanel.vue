<template>
  <div :class="[bem.b()]">
    <template v-if="!forceDestory && currentSchema && currentModel">
      <div :key="currentModel.id" :class="bem.e('group-list')">
        <template v-for="group in currentSchema.propertyGroups">
          <div :class="bem.e('group-item')">
            <div :class="bem.e('group-title')">{{ group.name }}</div>
            <div :class="bem.e('property-list')">
              <template v-for="property in group.properties">
                <property-item :schema="property" />
              </template>
            </div>
          </div>
        </template>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { CommonEvents, Model, SelectionManager } from '@stom/core';
import { useNamespace } from '../../../hooks/useNameSpace';
import { useStomStore } from '../store';
import { markRaw, nextTick, onBeforeUnmount, provide, Ref, ref } from 'vue';
import { currentModelKey, ModelSchema } from './property-panel';
import { schemaMap } from './schema';
import PropertyItem from './PropertyItem.vue';

const bem = useNamespace('property-panel');

const store = useStomStore();
const selectionList: Ref<Model[]> = ref([]);
const currentSchema = ref<ModelSchema | null>(null);
const currentModel: Ref<any> = ref(null);

provide(currentModelKey, currentModel);

let selectionManager: SelectionManager;

const forceDestory = ref(false);

const handleSelectionChange = async () => {
  // 属性面板发生变化时先强制销毁之前的组件
  forceDestory.value = true;
  await nextTick();
  forceDestory.value = false;
  selectionList.value = markRaw<Model[]>(selectionManager.getSelectionList());
  if (!selectionList.value.length) {
    currentSchema.value = schemaMap.scene;
    currentModel.value = store.getEditor();
  } else if (selectionList.value.length === 1) {
    const category = selectionList.value[0].getCategory();
    const schema = schemaMap[category] || null;
    currentSchema.value = schema;
    currentModel.value = markRaw<Model>(selectionList.value[0]);
  } else {
    currentSchema.value = null;
    currentModel.value = null;
  }
};

store.ready().then(() => {
  const editor = store.getEditor();
  selectionManager = editor.selectionManager;
  selectionManager.on(CommonEvents.change, handleSelectionChange);
  handleSelectionChange();
});

onBeforeUnmount(() => {
  selectionManager.off(CommonEvents.change, handleSelectionChange);
});
</script>
