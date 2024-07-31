import { IMatrixArr, IPoint, IRect, Matrix } from '@stom/geo';
import { Editor } from './editor';
import { findParentDom, TextStyle } from '@stom/shared';

const EMPTY = '\xa0';

export class TextInput {
  private container: HTMLDivElement = document.createElement('div');
  private inputDiv: HTMLDivElement = document.createElement('div');
  private callbck: null | ((text: string) => void) = null;
  private text = EMPTY;
  constructor(public editor: Editor) {
    this.container.style.position = 'absolute';
    Object.assign(this.container.style, {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transformOrigin: 'left top',
      borderStyle: 'solid',
      borderColor: 'transparent',
      boxSizing: 'border-box'
    });
    this.container.addEventListener('mousedown', e => {
      const el = findParentDom(e.target as HTMLElement, el => el === this.inputDiv);
      if (!el) {
        e.preventDefault();
      }
    });

    this.inputDiv.setAttribute('contenteditable', 'true');
    this.inputDiv.addEventListener('blur', this.handleBlur);
    this.inputDiv.addEventListener('input', this.handleInput);
    Object.assign(this.inputDiv.style, {
      wordBreak: 'break-all',
      whiteSpace: 'pre-wrap',
      textAlign: 'center',
      outlineStyle: 'none',
      lineHeight: 1.5
    });

    this.container.appendChild(this.inputDiv);
  }

  handleBlur = () => {
    const text = this.inputDiv.innerText;
    if (this.callbck) {
      this.callbck(text);
      this.callbck = null;
    }
    this.remove();
  };

  handleInput = () => {
    if (!this.inputDiv.innerText) {
      this.inputDiv.innerText = EMPTY;
    }
    this.text = this.inputDiv.innerText;
  };

  show(rect: IRect, { x, y }: IPoint, tf: IMatrixArr, text: string, style: TextStyle, cb: (text: string) => void) {
    this.container.style.left = `${x}px`;
    this.container.style.top = `${y}px`;
    this.container.style.width = `${rect.width}px`;
    this.container.style.height = `${rect.height}px`;
    this.container.style.transform = `matrix(${tf.join(',')})`;

    this.inputDiv.style.color = style.color;
    this.inputDiv.style.fontSize = `${style.fontSize}px`;
    this.inputDiv.style.fontFamily = style.fontFamily;
    this.inputDiv.style.lineHeight = `${style.lineHeight}`;

    text = text || EMPTY;
    this.text = text;
    this.inputDiv.innerText = text;
    this.editor.container.appendChild(this.container);
    setTimeout(() => {
      this.inputDiv.focus();
      this.callbck = cb;
    });
  }

  focus() {
    this.inputDiv.focus();
  }

  remove() {
    this.editor.container.removeChild(this.container);
    this.text = EMPTY;
  }
}
