<template>
  <div :class="[bem.b()]">
    <LibraryCollapse v-for="el in groupList" :title="el.groupName">
      <div @mousedown="handleMousedown($event, cls.CATEGORY)" :class="[bem.e('item')]" v-for="cls in el.models">
        <component :is="getIcon(cls.CATEGORY)"></component>
      </div>
    </LibraryCollapse>
    <Teleport to="body">
      <div :class="[bem.e('move')]" :style="{ left: `${moveContext.left}px`, top: `${moveContext.top}px` }" v-if="moveContext.visible">
        <component :is="getIcon(moveContext.currentCategory)"></component>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { PropType, reactive } from 'vue';
import { useNamespace } from '../../../hooks/useNameSpace';
import { ModelGroup } from './library';
import LibraryCollapse from './LibraryCollapse.vue';
import { Rect } from '../icons';
import { ModelClass } from '@stom/core';
import { findParentDom, useDragEvent } from '@stom/shared';
import { useStomStore } from '../store';

defineOptions({ name: 'Library' });

const store = useStomStore();

const bem = useNamespace('library');

defineProps({
  groupList: {
    type: Array as PropType<ModelGroup[]>,
    required: true
  }
});

const iconMap = {
  rect: Rect
};

const getIcon = (category: string) => {
  if (category in iconMap) {
    return iconMap[category];
  }
};

const moveContext = reactive({
  visible: false,
  currentCategory: '',
  left: 0,
  top: 0
});
const HALF_MOVE_SIZE = 20;
const handleMousedown = async (e: MouseEvent, category: string) => {
  moveContext.visible = true;
  moveContext.currentCategory = category;
  moveContext.left = e.pageX - HALF_MOVE_SIZE;
  moveContext.top = e.pageY - HALF_MOVE_SIZE;
  useDragEvent(
    {
      onDragMove(e) {
        moveContext.left = e.pageX - HALF_MOVE_SIZE;
        moveContext.top = e.pageY - HALF_MOVE_SIZE;
      },
      onDragEnd(e) {
        moveContext.visible = false;
        const editor = store.getEditor();
        const target = e.target as HTMLElement;
        if (findParentDom(target, parent => parent === editor.container)) {
          const instance = store.getModelManager().getInstance(category);
          const pos = editor.viewportManager.getCursorScenePoint(e);
          instance.setCenterPosition(pos.x, pos.y);
          editor.addModel(instance);
        }
      }
    },
    e
  );
};
</script>
