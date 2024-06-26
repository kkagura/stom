export interface DragEventOptions {
  onDragStart?: (e: MouseEvent) => void;
  onDragMove?: (e: MouseEvent) => void;
  onDragEnd?: (e: MouseEvent) => void;
}

export const useDragEvent = (options: DragEventOptions) => {
  let started = false;

  const onMove = (e: MouseEvent) => {
    if (!started) {
      started = true;
      options.onDragStart?.(e);
    }
    options.onDragMove?.(e);
  };

  const onUp = (e: MouseEvent) => {
    options.onDragEnd?.(e);
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup', onUp);
    window.removeEventListener('mouseleave', onUp);
  };

  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);
  window.addEventListener('mouseleave', onUp);
};
