import { IMatrixArr, IPoint, IRect, Matrix } from '@stom/geo';
import { Editor } from './editor';
import { TextStyle } from './models';

export class TextInput {
  private inputDiv: HTMLDivElement = document.createElement('div');
  private callbck: null | ((text: string) => void) = null;
  constructor(public editor: Editor) {
    this.inputDiv.style.position = 'absolute';
    this.inputDiv.setAttribute('contenteditable', 'true');
    this.inputDiv.addEventListener('blur', this.handleBlur);
    // todo: 聚焦后的样式需要修改
    Object.assign(this.inputDiv.style, {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      lineHeight: 1.5,
      transformOrigin: 'left top',
      wordBreak: 'break-all',
      whiteSpace: 'pre-wrap'
    });
  }

  handleBlur = () => {
    const text = this.inputDiv.innerText;
    if (this.callbck) {
      this.callbck(text);
      this.callbck = null;
    }
    this.remove();
  };

  show(rect: IRect, { x, y }: IPoint, tf: IMatrixArr, text: string, style: TextStyle, cb: (text: string) => void) {
    this.inputDiv.style.left = `${x}px`;
    this.inputDiv.style.top = `${y}px`;
    this.inputDiv.style.width = `${rect.width}px`;
    this.inputDiv.style.height = `${rect.height}px`;
    this.inputDiv.style.transform = `matrix(${tf.join(',')})`;
    this.inputDiv.style.color = style.color;
    this.inputDiv.style.fontSize = `${style.fontSize}px`;

    this.inputDiv.innerText = text;
    this.editor.container.appendChild(this.inputDiv);
    setTimeout(() => {
      this.inputDiv.focus();
      this.callbck = cb;
    });
  }

  remove() {
    // this.editor.container.removeChild(this.inputDiv);
  }
}
