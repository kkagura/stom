import { computed, onBeforeUnmount, ref, Ref, unref, watch } from 'vue';
import { createPopper, Placement, type PositioningStrategy, type Instance } from '@popperjs/core';

export const usePopper = (
  referenceElementRef: Ref<HTMLElement | undefined>,
  popperElementRef: Ref<HTMLElement | undefined>,
  opts: Ref<{
    placement?: Placement;
    strategy?: PositioningStrategy;
  }>
) => {
  const instanceRef = ref<Instance>();

  const options = computed(() => {
    return {
      onFirstUpdate: () => {
        instanceRef.value?.update();
      },
      placement: opts.value.placement || 'bottom',
      strategy: opts.value.strategy || 'fixed'
    };
  });

  const destroy = () => {
    if (!instanceRef.value) return;

    instanceRef.value.destroy();
    instanceRef.value = undefined;
  };

  watch([referenceElementRef, popperElementRef], ([referenceElement, popperElement]) => {
    destroy();
    if (!referenceElement || !popperElement) return;

    instanceRef.value = createPopper(referenceElement, popperElement, unref(options));
    console.log(instanceRef.value);
  });

  watch(
    options,
    newOptions => {
      const instance = unref(instanceRef);
      if (instance) {
        instance.setOptions(newOptions);
      }
    },
    {
      deep: true
    }
  );

  onBeforeUnmount(() => {
    destroy();
  });

  return {
    update: () => instanceRef.value?.update()
  };
};
