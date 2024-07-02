import { Editor } from '../editor';
import { CommonEvents } from '../models';
import { Command } from './command';
import { CommandName } from './command-manager';

export class UndoCommand extends Command {
  constructor(editor: Editor) {
    super(editor);
    editor.actionManager.on(CommonEvents.change, () => {
      this.emit(CommonEvents.change);
    });
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

  static name: CommandName = CommandName.UNDO;
}
