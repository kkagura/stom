import { Editor } from '../editor';
import { CommonEvents } from '../models';
import { Command } from './command';

export class DeleteCommand extends Command {
  static name = 'delete';

  constructor(editor: Editor) {
    super(editor);
    editor.selectionManager.on(CommonEvents.change, this.statusChange);
  }

  execute(): void {
    this.editor.removeSelection();
  }

  isEnable(): boolean {
    const selection = this.editor.selectionManager.getSelectionList();
    return selection.length > 0;
  }

  dispose(): void {
    super.dispose();
    this.editor.selectionManager.off(CommonEvents.change, this.statusChange);
  }

  getName() {
    return DeleteCommand.name;
  }

  getLabel() {
    return '删除选中';
  }
}
