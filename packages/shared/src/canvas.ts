export function getDevicePixelRatio() {
  return window.devicePixelRatio || 1;
}

export function setCanvasSize(canvas: HTMLCanvasElement, width: number, height: number) {
  const devicePixelRatio = getDevicePixelRatio();
  canvas.width = width * devicePixelRatio;
  canvas.height = height * devicePixelRatio;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
}
