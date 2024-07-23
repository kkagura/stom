import { IRect } from '@stom/geo';
import { Editor } from './editor';
import { Model } from './models';

export class TextInput {
  constructor(public editor: Editor) {}

  show(rect: IRect, text: string, style: any) {}
}
