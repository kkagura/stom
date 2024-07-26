import { IMatrixArr, IRect, Matrix } from '@stom/geo';
import { Editor } from './editor';
import { Model } from './models';

export class TextInput {
  inputDiv: HTMLDivElement = document.createElement('div');

  constructor(public editor: Editor) {
    this.inputDiv.style.position = 'absolute';
    this.inputDiv.setAttribute('contenteditable', 'true');
    this.inputDiv.addEventListener('blur', this.handleBlur);
    // 调试
    Object.assign(this.inputDiv.style, {
      border: '1px solid red'
    });
  }

  handleBlur = () => {
    this.remove();
  };

  show(rect: IRect, worldTf: IMatrixArr, text: string, style: any) {
    const { x, y } = rect;
    const zoom = this.editor.viewportManager.getZoom();
    worldTf[4] = 0;
    worldTf[5] = 0;
    const p1 = new Matrix(...worldTf).apply({ x, y });
    const point = this.editor.viewportManager.getViewPoint(p1, zoom);
    this.inputDiv.style.left = `${point.x}px`;
    this.inputDiv.style.top = `${point.y}px`;
    this.inputDiv.style.width = `${rect.width * zoom}px`;
    this.inputDiv.style.height = `${rect.height * zoom}px`;
    this.inputDiv.style.transition = 'all 1.3s ';
    this.inputDiv.style.transform = `matrix(${worldTf.join(',')})`;
    this.editor.container.appendChild(this.inputDiv);
    this.inputDiv.focus();
  }

  remove() {
    // this.editor.container.removeChild(this.inputDiv);
  }
}
