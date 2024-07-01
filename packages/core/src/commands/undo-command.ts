import { Command } from './command';
import { CommandName } from './command-manager';

export class UndoCommond extends Command {
  isEnable(): boolean {
    return this.editor.actionManager.undoable();
  }

  execute() {
    this.editor.actionManager.undo();
  }

  getName() {
    return UndoCommond.name;
  }

  static name: CommandName = CommandName.UNDO;
}
