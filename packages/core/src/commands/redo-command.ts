import { Editor } from '../editor';
import { CommonEvents } from '../models';
import { Command } from './command';

export class RndoCommand extends Command {
  constructor(editor: Editor) {
    super(editor);
    editor.actionManager.on(CommonEvents.change, this.statusChange);
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

  dispose(): void {
    super.dispose();
    this.editor.actionManager.off(CommonEvents.change, this.statusChange);
  }

  static name = 'redo';
}
