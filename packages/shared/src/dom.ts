export interface DragEventOptions {
  onDragStart?: (e: MouseEvent) => void;
  onDragMove?: (e: MouseEvent, movement: [dx: number, dy: number]) => void;
  onDragEnd?: (e: MouseEvent) => void;
}

export const useDragEvent = (options: DragEventOptions, e: MouseEvent) => {
  let started = false;
  let startX = e.pageX,
    startY = e.pageY;

  const onMove = (e: MouseEvent) => {
    const dx = e.pageX - startX,
      dy = e.pageY - startY;
    if (!started) {
      started = true;
      options.onDragStart?.(e);
    }
    options.onDragMove?.(e, [dx, dy]);
  };

  const onUp = (e: MouseEvent) => {
    started && options.onDragEnd?.(e);
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup', onUp);
    window.removeEventListener('mouseleave', onUp);
  };

  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);
  window.addEventListener('mouseleave', onUp);
};

export const findParentDom = (dom: HTMLElement, match: (el: HTMLElement) => boolean) => {
  let parent = dom.parentElement;
  while (parent) {
    if (match(parent)) {
      return parent;
    }
    parent = parent.parentElement;
  }
  return null;
};
