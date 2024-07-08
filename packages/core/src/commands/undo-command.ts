import { Editor } from '../editor';
import { CommonEvents } from '../models';
import { Command } from './command';

export class UndoCommand extends Command {
  constructor(editor: Editor) {
    super(editor);
    editor.actionManager.on(CommonEvents.change, this.statusChange);
  }

  isEnable(): boolean {
    return this.editor.actionManager.undoable();
  }

  execute() {
    this.editor.actionManager.undo();
  }

  getName() {
    return UndoCommand.name;
  }

  dispose(): void {
    super.dispose();
    this.editor.actionManager.off(CommonEvents.change, this.statusChange);
  }

  getLabel() {
    return '撤回';
  }

  static name = 'undo';
}
