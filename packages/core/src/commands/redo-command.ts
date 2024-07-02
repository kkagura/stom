import { Editor } from '../editor';
import { CommonEvents } from '../models';
import { Command } from './command';
import { CommandName } from './command-manager';

export class RndoCommand extends Command {
  constructor(editor: Editor) {
    super(editor);
    editor.actionManager.on(CommonEvents.change, () => {
      this.emit(CommonEvents.change);
    });
  }

  isEnable(): boolean {
    return this.editor.actionManager.redoable();
  }

  execute() {
    this.editor.actionManager.redo();
  }

  getName() {
    return RndoCommand.name;
  }

  static name: CommandName = CommandName.REDO;
}
