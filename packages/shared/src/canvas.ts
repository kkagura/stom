import { IRect } from '@stom/geo';

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

export function clearDrawStyle(ctx: CanvasRenderingContext2D) {
  ctx.setLineDash([]);
  ctx.lineDashOffset = 0;
  ctx.lineCap = 'butt';
  ctx.lineJoin = 'miter';
}

export interface TextStyle {
  color: string;
  fontSize: number;
  lineHeight: number;
  fontFamily: string;
}

const LINE_WRAP_REG = /(\n|\r|\r\n)/;
export function fillText(ctx: CanvasRenderingContext2D, rect: IRect, text: string, style: TextStyle) {
  if (!text) return;
  const lines: {
    text: string;
    width: number;
  }[] = [];

  const { width, height } = rect;
  const { fontSize, fontFamily, lineHeight } = style;
  const lh = fontSize * lineHeight;
  ctx.font = `${fontSize}px ${fontFamily}`;
  let w = 0,
    line = '';
  for (let i = 0; i < text.length; i++) {
    const code = text[i];
    if (LINE_WRAP_REG.test(code)) {
      lines.push({
        text: line,
        width: w
      });
      w = 0;
      line = '';
    } else {
      const codeWidth = ctx.measureText(code).width;
      if (w + codeWidth > width) {
        lines.push({
          text: line,
          width: w
        });
        line = code;
        w = codeWidth;
      } else {
        w += codeWidth;
        line += code;
      }
    }
  }

  lines.push({
    text: line,
    width: w
  });

  const centerY = rect.y + height / 2;
  const centerX = rect.x + width / 2;
  // 所有文字的高度
  const textHeight = lines.length * lh;
  const startY = centerY - textHeight / 2;

  ctx.beginPath();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = style.color;
  lines.forEach((item, i) => {
    const x = centerX - item.width / 2;
    const y = startY + lh * i + lh / 2;
    ctx.fillText(item.text, x, y);
  });
}
