import { AlignDir } from '../align-manager';
import { Editor } from '../editor';
import { LinkModel } from '../models';
import { CommonEvents } from '../models/common-events';
import { Command } from './command';

export class AlignBottomCommand extends Command {
  constructor(editor: Editor) {
    super(editor);
    editor.selectionManager.on(CommonEvents.change, this.statusChange);
  }

  isEnable(): boolean {
    return this.getTargetList().length > 1;
  }

  execute() {
    const models = this.getTargetList();
    this.editor.alignManager.align(models, AlignDir.BOTTOM);
  }

  getName() {
    return AlignBottomCommand.name;
  }

  dispose(): void {
    super.dispose();
    this.editor.actionManager.off(CommonEvents.change, this.statusChange);
  }

  getLabel() {
    return '下对齐';
  }

  getTargetList() {
    // 连线不允许对齐
    return this.editor.selectionManager.getSelectionList().filter(el => !(el instanceof LinkModel));
  }

  static name = 'alignBottom';
}
